#[test_only]
module move_goals::move_goals_tests {
    use std::signer;
    use aptos_framework::account;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::{Self, AptosCoin};
    use aptos_framework::timestamp;
    
    use move_goals::challenge_factory;

    #[test(admin = @move_goals, creator = @0x123, user = @0x456, verifier = @0x789, framework = @aptos_framework)]
    public entry fun test_end_to_end_flow(
        admin: &signer,
        creator: &signer,
        user: &signer,
        verifier: &signer,
        framework: &signer
    ) {
        // 1. Setup Time and Accounts
        timestamp::set_time_has_started_for_testing(framework);
        account::create_account_for_test(signer::address_of(admin));
        account::create_account_for_test(signer::address_of(creator));
        account::create_account_for_test(signer::address_of(user));
        account::create_account_for_test(signer::address_of(verifier));
        
        // 2. Initialize AptosCoin and Mint to User
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(framework);
        coin::register<AptosCoin>(user);
        let stake_amount = 50;
        coin::deposit(signer::address_of(user), coin::mint(100, &mint_cap));
        
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);

        // 3. Initialize Contract
        challenge_factory::initialize(admin);

        // 4. Create Challenge
        challenge_factory::create_challenge(
            creator,
            b"30 Day Fitness",
            1, // 1 day duration for test
            stake_amount,
            signer::address_of(verifier)
        );

        // 5. Join Challenge
        challenge_factory::join_challenge(user, 0);
        assert!(coin::balance<AptosCoin>(signer::address_of(user)) == 50, 0);

        // 6. Verification
        challenge_factory::submit_checkin(verifier, signer::address_of(user), 0);

        // 7. Claim
        challenge_factory::claim_reward(user, 0);
        assert!(coin::balance<AptosCoin>(signer::address_of(user)) == 100, 1);
    }
}