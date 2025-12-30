module move_goals::challenge_factory {
    use std::signer;
    use std::vector;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::timestamp;
    use aptos_framework::event;

    // Error Codes
    const E_CHALLENGE_NOT_ACTIVE: u64 = 1;
    const E_ALREADY_JOINED: u64 = 2;
    const E_INCORRECT_STAKE: u64 = 3;
    const E_NOT_AUTHORIZED: u64 = 4; // Hub not initialized
    const E_CHALLENGE_NOT_FOUND: u64 = 5;
    const E_INVALID_VERIFIER: u64 = 6;
    const E_ALREADY_CLAIMED: u64 = 7;   
    const E_CHALLENGE_STILL_ACTIVE: u64 = 8;
    const E_NOT_ADMIN: u64 = 9;
    const E_INSUFFICIENT_FUNDS: u64 = 10;

    struct ChallengeHub has key {
        challenges: vector<Challenge>,
        payment_vault: Coin<AptosCoin>,
        admin: address,
    }

    struct Challenge has store, drop {
        id: u64,
        creator: address,
        verifier: address, 
        title: vector<u8>,
        duration_days: u64,
        stake_amount: u64,
        start_time: u64,
        total_pool: u64,
        active: bool,
        participants: vector<address>,
        survivors_claimed: u64,
    }

    struct UserProgress has key {
        challenge_ids: vector<u64>, 
        days_completed: vector<u64>,
        last_check_in: vector<u64>, 
        claimed: vector<bool>,      
    }

    #[event]
    struct ChallengeCreated has drop, store {
        id: u64,
        creator: address,
        stake: u64,
        duration: u64,
    }

    #[event]
    struct UserJoined has drop, store {
        challenge_id: u64,
        user: address,
    }
    
    #[event]
    struct CheckInVerified has drop, store {
        challenge_id: u64,
        user: address,
        day_count: u64,
    }

    /// Initializes the Hub. This MUST be called by the @move_goals account once.
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        // Ensure only the intended admin address can hold the Hub
        assert!(admin_addr == @move_goals, E_NOT_ADMIN);
        
        if (!exists<ChallengeHub>(admin_addr)) {
            move_to(admin, ChallengeHub {
                challenges: vector::empty<Challenge>(),
                payment_vault: coin::zero<AptosCoin>(),
                admin: admin_addr,
            });
        }
    }

    public entry fun create_challenge(
        creator: &signer,
        title: vector<u8>,
        duration: u64,
        stake: u64,
        verifier: address 
    ) acquires ChallengeHub {
        let hub_addr = @move_goals; 
        // If this fails, you need to run the initialize() function first!
        assert!(exists<ChallengeHub>(hub_addr), E_NOT_AUTHORIZED);
        
        let hub = borrow_global_mut<ChallengeHub>(hub_addr);
        let new_id = vector::length(&hub.challenges);
        
        let new_challenge = Challenge {
            id: new_id,
            creator: signer::address_of(creator),
            verifier: verifier, 
            title: title,
            duration_days: duration,
            stake_amount: stake,
            start_time: timestamp::now_seconds(),
            total_pool: 0,
            active: true,
            participants: vector::empty<address>(),
            survivors_claimed: 0,
        };

        vector::push_back(&mut hub.challenges, new_challenge);

        event::emit(ChallengeCreated {
            id: new_id,
            creator: signer::address_of(creator),
            stake: stake,
            duration: duration,
        });
    }

    public entry fun join_challenge(
        user: &signer,
        challenge_id: u64
    ) acquires ChallengeHub, UserProgress {
        let user_addr = signer::address_of(user);
        let hub_addr = @move_goals; 
        assert!(exists<ChallengeHub>(hub_addr), E_NOT_AUTHORIZED);

        let hub = borrow_global_mut<ChallengeHub>(hub_addr);
        let challenge = vector::borrow_mut(&mut hub.challenges, challenge_id);
        
        assert!(challenge.active, E_CHALLENGE_NOT_ACTIVE);
        
        // Membership check
        let i = 0;
        let len = vector::length(&challenge.participants);
        while (i < len) {
            assert!(*vector::borrow(&challenge.participants, i) != user_addr, E_ALREADY_JOINED);
            i = i + 1;
        };
        
        // Withdraw stake from user and merge into vault
        let coins = coin::withdraw<AptosCoin>(user, challenge.stake_amount);
        coin::merge(&mut hub.payment_vault, coins);
        
        challenge.total_pool = challenge.total_pool + challenge.stake_amount;
        vector::push_back(&mut challenge.participants, user_addr);

        if (!exists<UserProgress>(user_addr)) {
            move_to(user, UserProgress {
                challenge_ids: vector::empty(),
                days_completed: vector::empty(),
                last_check_in: vector::empty(),
                claimed: vector::empty(),
            });
        };

        let progress = borrow_global_mut<UserProgress>(user_addr);
        vector::push_back(&mut progress.challenge_ids, challenge_id);
        vector::push_back(&mut progress.days_completed, 0);
        vector::push_back(&mut progress.last_check_in, 0);
        vector::push_back(&mut progress.claimed, false);

        event::emit(UserJoined { challenge_id, user: user_addr });
    }

    public entry fun submit_checkin(
        verifier_account: &signer, 
        user_addr: address,
        challenge_id: u64
    ) acquires ChallengeHub, UserProgress {
        let hub_addr = @move_goals;
        let hub = borrow_global_mut<ChallengeHub>(hub_addr);
        let challenge = vector::borrow(&hub.challenges, challenge_id);

        assert!(signer::address_of(verifier_account) == challenge.verifier, E_INVALID_VERIFIER);
        assert!(challenge.active, E_CHALLENGE_NOT_ACTIVE);

        let progress = borrow_global_mut<UserProgress>(user_addr);
        let (found, index) = get_challenge_index(&progress.challenge_ids, challenge_id);
        assert!(found, E_CHALLENGE_NOT_FOUND);

        let current_days = *vector::borrow(&progress.days_completed, index);
        let new_days = current_days + 1;
        
        *vector::borrow_mut(&mut progress.days_completed, index) = new_days;
        *vector::borrow_mut(&mut progress.last_check_in, index) = timestamp::now_seconds();

        event::emit(CheckInVerified { 
            challenge_id, 
            user: user_addr, 
            day_count: new_days 
        });
    }

    public entry fun claim_reward(
        user: &signer,
        challenge_id: u64
    ) acquires ChallengeHub, UserProgress {
        let user_addr = signer::address_of(user);
        let hub_addr = @move_goals;
        let hub = borrow_global_mut<ChallengeHub>(hub_addr);
        let challenge = vector::borrow_mut(&mut hub.challenges, challenge_id);

        let progress = borrow_global_mut<UserProgress>(user_addr);
        let (found, index) = get_challenge_index(&progress.challenge_ids, challenge_id);
        assert!(found, E_CHALLENGE_NOT_FOUND);

        let completed_days = *vector::borrow(&progress.days_completed, index);
        let already_claimed = *vector::borrow(&progress.claimed, index);

        assert!(!already_claimed, E_ALREADY_CLAIMED);
        assert!(completed_days >= challenge.duration_days, E_CHALLENGE_STILL_ACTIVE);
        
        // Verify sufficient funds in vault
        let vault_balance = coin::value(&hub.payment_vault);
        assert!(vault_balance >= challenge.stake_amount, E_INSUFFICIENT_FUNDS);
        
        *vector::borrow_mut(&mut progress.claimed, index) = true;
        challenge.survivors_claimed = challenge.survivors_claimed + 1;

        // Extract reward and send to user
        let payout_amount = challenge.stake_amount;
        let reward_coins = coin::extract(&mut hub.payment_vault, payout_amount);
        coin::deposit<AptosCoin>(user_addr, reward_coins);
    }

    fun get_challenge_index(ids: &vector<u64>, target_id: u64): (bool, u64) {
        let len = vector::length(ids);
        let i = 0;
        while (i < len) {
            if (*vector::borrow(ids, i) == target_id) {
                return (true, i)
            };
            i = i + 1;
        };
        (false, 0)
    }
}