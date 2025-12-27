#[test_only]
module move_goals::move_goals_tests {
    use std::signer;
    use std::vector;
    use std::unit_test;
    use aptos_framework::account;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::{Self, AptosCoin};
    use aptos_framework::timestamp;
    
    // Import your main module
    use move_goals::challenge_factory;

    // Helper to set up a user with money
    fun setup_user(framework: &signer, user: &signer, amount: u64) {
        account::create_account_for_test(signer::address_of(user));
        coin::register<AptosCoin>(user);
        
        // Mint coins (Aptos framework specific test logic)
        if (!coin::is_coin_initialized<AptosCoin>()) {
            let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(framework);
            coin::deposit(signer::address_of(user), coin::mint(amount, &mint_cap));
            coin::destroy_burn_cap(burn_cap);
            coin::destroy_mint_cap(mint_cap);
        } else {
            // If already initialized, we need a stored capability (omitted for simple test flow)
            // For this single-test flow, initialization happens once.
        };
    }

    #[test(admin = @move_goals, creator = @0x123, user = @0x456, verifier = @0x789, framework = @aptos_framework)]
    public entry fun test_end_to_end_flow(
        admin: &signer,
        creator: &signer,
        user: &signer,
        verifier: &signer,
        framework: &signer
    ) {
        // ----------------------------------------------------------------
        // 1. SETUP ENVIRONMENT
        // ----------------------------------------------------------------
        timestamp::set_time_has_started_for_testing(framework);
        
        // Create accounts
        account::create_account_for_test(signer::address_of(admin));
        account::create_account_for_test(signer::address_of(creator));
        account::create_account_for_test(signer::address_of(verifier));
        
        // Give the User 100 Coins
        let stake_amount = 50;
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(framework);
        account::create_account_for_test(signer::address_of(user));
        coin::register<AptosCoin>(user);
        coin::deposit(signer::address_of(user), coin::mint(100, &mint_cap));
        
        // Clean up caps
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);

        // Initialize your Contract
        challenge_factory::initialize(admin);

        // ----------------------------------------------------------------
        // 2. CREATE CHALLENGE (Duration: 1 Day)
        // ----------------------------------------------------------------
        let challenge_title = b"Code Daily";
        let duration = 1; 
        
        challenge_factory::create_challenge(
            creator,
            challenge_title,
            duration,
            stake_amount,
            signer::address_of(verifier)
        );

        // ----------------------------------------------------------------
        // 3. USER JOINS
        // ----------------------------------------------------------------
        let challenge_id = 0;
        challenge_factory::join_challenge(user, challenge_id);

        // Assert: User balance should decrease by 50
        assert!(coin::balance<AptosCoin>(signer::address_of(user)) == 50, 0);

        // ----------------------------------------------------------------
        // 4. SUBMIT CHECK-IN (Day 1)
        // ----------------------------------------------------------------
        // Verifier approves the work
        challenge_factory::submit_checkin(verifier, signer::address_of(user), challenge_id);

        // ----------------------------------------------------------------
        // 5. CLAIM REWARD
        // ----------------------------------------------------------------
        // Check current balance before claim
        let balance_before = coin::balance<AptosCoin>(signer::address_of(user));
        
        challenge_factory::claim_reward(user, challenge_id);

        // Assert: User got their 50 coins back
        let balance_after = coin::balance<AptosCoin>(signer::address_of(user));
        assert!(balance_after == balance_before + 50, 1);
        
        // Final sanity check
        assert!(balance_after == 100, 2);
    }
}