// Every test in assessment-server/tests, as collected by
// `pytest --collect-only -q`. Parametrised tests are listed once, with
// their number of cases.

export interface SuiteTest {
    name: string
    cases?: number
}

export interface SuiteGroup {
    name: string
    tests: SuiteTest[]
}

export interface SuiteFile {
    file: string
    count: number
    groups: SuiteGroup[]
}

export const TEST_TOTAL = 202

export const TEST_FILES: SuiteFile[] = [
    {
        file: 'test_api.py',
        count: 23,
        groups: [
            {
                name: 'TestBook',
                tests: [
                    { name: 'test_201_with_the_appointment_in_clinic_time' },
                    { name: 'test_401_without_a_token' },
                    { name: 'test_409_when_the_slot_is_taken' },
                    { name: 'test_400_outside_working_hours' },
                    { name: 'test_422_without_a_utc_offset' },
                    { name: 'test_a_retry_with_the_idempotency_key_replays' }
                ]
            },
            {
                name: 'TestAvailability',
                tests: [
                    { name: 'test_lists_free_slots_and_hides_booked_ones' },
                    { name: 'test_404_for_an_unknown_doctor' },
                    { name: 'test_422_without_a_date' }
                ]
            },
            {
                name: 'TestCancel',
                tests: [
                    { name: 'test_200_frees_the_slot' },
                    { name: 'test_422_without_a_reason', cases: 3 },
                    { name: 'test_409_when_already_cancelled' },
                    { name: 'test_404_for_someone_elses_appointment' }
                ]
            },
            {
                name: 'TestReschedule',
                tests: [
                    { name: 'test_200_moves_it_and_frees_the_old_slot' },
                    { name: 'test_409_onto_a_taken_slot' },
                    { name: 'test_409_when_cancelled' }
                ]
            },
            {
                name: 'TestPatientAppointments',
                tests: [
                    { name: 'test_the_patient_sees_upcoming_ones_soonest_first' },
                    { name: 'test_past_appointments_are_left_out' },
                    { name: 'test_staff_see_only_what_they_could_see_anyway' },
                    { name: 'test_404_for_another_patient' },
                    { name: 'test_401_without_a_token' }
                ]
            }
        ]
    },
    {
        file: 'test_auth.py',
        count: 11,
        groups: [
            {
                name: 'TestRegister',
                tests: [
                    { name: 'test_a_clinic_sign_up_lists_the_new_facility' },
                    { name: 'test_a_patient_sign_up_lists_none' }
                ]
            },
            {
                name: 'TestStaff',
                tests: [
                    { name: 'test_login_and_me_list_their_facility', cases: 2 },
                    { name: 'test_an_inactive_facility_is_still_listed', cases: 2 }
                ]
            },
            {
                name: 'TestOthers',
                tests: [
                    { name: 'test_a_patient_lists_none' },
                    { name: 'test_a_super_admin_lists_none' }
                ]
            },
            {
                name: 'TestAcceptInvite',
                tests: [
                    { name: 'test_an_invited_doctor_gets_their_facility' }
                ]
            },
            {
                name: 'TestQueries',
                tests: [
                    { name: 'test_me_loads_the_facility_with_the_user' },
                    { name: 'test_login_loads_the_facility_with_the_user' }
                ]
            }
        ]
    },
    {
        file: 'test_availability_unit.py',
        count: 9,
        groups: [
            {
                name: '',
                tests: [
                    { name: 'test_slots_are_every_30_minutes_within_the_period' },
                    { name: 'test_a_slot_that_would_overrun_the_period_is_left_out' },
                    { name: 'test_several_periods_are_merged_in_order' },
                    { name: 'test_no_working_hours_means_no_slots' },
                    { name: 'test_wall_times_skipped_by_spring_forward_are_not_offered' },
                    { name: 'test_slot_end_is_30_minutes_of_real_time_across_a_dst_change' },
                    { name: 'test_available_slots_exclude_booked_ones_and_those_too_soon' },
                    { name: 'test_a_slot_exactly_an_hour_away_is_available_but_not_one_sooner' },
                    { name: 'test_local_day_bounds_are_the_utc_instants_of_local_midnight' }
                ]
            }
        ]
    },
    {
        file: 'test_booking.py',
        count: 20,
        groups: [
            {
                name: '',
                tests: [
                    { name: 'test_books_a_free_slot' },
                    { name: 'test_accepts_the_same_instant_in_another_offset' },
                    { name: 'test_slot_must_be_on_the_grid_within_working_hours', cases: 4 },
                    { name: 'test_rejects_a_day_the_doctor_does_not_work' },
                    { name: 'test_rejects_a_time_in_the_past' },
                    { name: 'test_rejects_a_slot_less_than_an_hour_away' },
                    { name: 'test_a_taken_slot_cannot_be_booked_by_someone_else' },
                    { name: 'test_other_doctors_are_unaffected_by_a_booking' },
                    { name: 'test_a_patient_cannot_hold_two_slots_at_once_in_one_facility' },
                    { name: 'test_a_cancelled_slot_can_be_booked_again' },
                    { name: 'test_only_patients_book_for_themselves' },
                    { name: 'test_a_deactivated_doctor_cannot_be_booked' },
                    { name: 'test_a_deactivated_facility_cannot_be_booked' }
                ]
            },
            {
                name: 'TestIdempotency',
                tests: [
                    { name: 'test_a_retry_with_the_same_key_returns_the_original_booking' },
                    { name: 'test_reusing_a_key_for_a_different_booking_is_rejected' },
                    { name: 'test_keys_are_per_user' },
                    { name: 'test_a_failed_booking_does_not_burn_the_key' }
                ]
            }
        ]
    },
    {
        file: 'test_cancel_reschedule.py',
        count: 16,
        groups: [
            {
                name: 'TestCancel',
                tests: [
                    { name: 'test_records_who_cancelled_and_why' },
                    { name: 'test_cancelling_twice_is_a_conflict' },
                    { name: 'test_a_started_appointment_cannot_be_cancelled' },
                    { name: 'test_another_patient_cannot_see_it' },
                    { name: 'test_its_doctor_and_the_facility_admin_can_cancel' },
                    { name: 'test_another_facilitys_admin_cannot_see_it' }
                ]
            },
            {
                name: 'TestReschedule',
                tests: [
                    { name: 'test_moves_the_booking_and_frees_the_old_slot' },
                    { name: 'test_the_new_slot_is_validated_like_a_booking' },
                    { name: 'test_cannot_move_onto_a_taken_slot' },
                    { name: 'test_cannot_move_onto_the_patients_other_booking' },
                    { name: 'test_the_current_time_is_a_no_op' },
                    { name: 'test_a_cancelled_appointment_cannot_be_moved' },
                    { name: 'test_a_started_appointment_cannot_be_moved' },
                    { name: 'test_not_if_the_doctor_was_deactivated' },
                    { name: 'test_another_patient_cannot_see_it' },
                    { name: 'test_another_doctor_at_the_facility_cannot_move_it' }
                ]
            }
        ]
    },
    {
        file: 'test_concurrency.py',
        count: 2,
        groups: [
            {
                name: '',
                tests: [
                    { name: 'test_only_one_of_two_simultaneous_bookings_wins' },
                    { name: 'test_a_double_submitted_booking_is_stored_once' }
                ]
            }
        ]
    },
    {
        file: 'test_config.py',
        count: 6,
        groups: [
            {
                name: '',
                tests: [
                    { name: 'test_database_urls_from_hosts_use_psycopg_3', cases: 3 },
                    { name: 'test_cors_origins_are_a_comma_separated_list' },
                    { name: 'test_the_commit_comes_from_the_host' },
                    { name: 'test_an_empty_commit_is_unknown' }
                ]
            }
        ]
    },
    {
        file: 'test_emails.py',
        count: 21,
        groups: [
            {
                name: 'TestForgotPassword',
                tests: [
                    { name: 'test_emails_a_reset_link_to_the_account' },
                    { name: 'test_an_unknown_email_gets_the_same_answer_and_no_email' },
                    { name: 'test_a_deactivated_account_gets_no_email' },
                    { name: 'test_one_address_can_only_be_sent_a_few' }
                ]
            },
            {
                name: 'TestResetPassword',
                tests: [
                    { name: 'test_sets_the_password_and_signs_in' },
                    { name: 'test_a_link_works_once' },
                    { name: 'test_using_a_newer_link_cancels_an_older_one' },
                    { name: 'test_an_expired_link_is_refused' },
                    { name: 'test_an_invite_token_is_not_a_reset_token' },
                    { name: 'test_a_deactivated_account_cannot_reset' },
                    { name: 'test_an_invited_user_can_set_a_password_this_way' },
                    { name: 'test_a_weak_password_is_refused' }
                ]
            },
            {
                name: 'TestStaffInvites',
                tests: [
                    { name: 'test_a_new_member_is_emailed_a_working_invite', cases: 2 },
                    { name: 'test_a_reissued_invite_is_emailed', cases: 2 }
                ]
            },
            {
                name: 'TestPatientInvites',
                tests: [
                    { name: 'test_a_new_patient_is_emailed_their_appointment' },
                    { name: 'test_a_replayed_booking_sends_no_second_email' },
                    { name: 'test_a_patient_who_can_sign_in_gets_no_invite' },
                    { name: 'test_a_reissued_patient_invite_is_emailed' }
                ]
            },
            {
                name: 'TestDeliveryFailure',
                tests: [
                    { name: 'test_is_logged_without_the_address_and_the_request_succeeds' }
                ]
            }
        ]
    },
    {
        file: 'test_events.py',
        count: 12,
        groups: [
            {
                name: 'TestPublishing',
                tests: [
                    { name: 'test_a_booking_tells_its_patient_doctor_and_facility' },
                    { name: 'test_a_booking_for_a_patient_names_the_admin' },
                    { name: 'test_other_doctors_and_facilities_are_not_told' },
                    { name: 'test_a_cancellation_and_a_reschedule_are_published' },
                    { name: 'test_nothing_is_published_when_nothing_changes' },
                    { name: 'test_a_booking_still_succeeds_when_redis_is_down' }
                ]
            },
            {
                name: 'TestChannels',
                tests: [
                    { name: 'test_each_role_follows_what_it_can_read' }
                ]
            },
            {
                name: 'TestStreamRoute',
                tests: [
                    { name: 'test_needs_a_token' },
                    { name: 'test_is_refused_to_super_admins' },
                    { name: 'test_streams_the_callers_events_until_the_token_expires' }
                ]
            },
            {
                name: 'TestStream',
                tests: [
                    { name: 'test_ends_at_the_deadline' },
                    { name: 'test_sends_a_heartbeat_when_idle' }
                ]
            }
        ]
    },
    {
        file: 'test_facility_availability.py',
        count: 26,
        groups: [
            {
                name: 'TestShape',
                tests: [
                    { name: 'test_one_entry_per_day_including_empty_ones' },
                    { name: 'test_defaults_to_14_days_from_today_at_the_facility' },
                    { name: 'test_working_hours_weekdays_count_from_monday_0' }
                ]
            },
            {
                name: 'TestSlots',
                tests: [
                    { name: 'test_match_the_per_doctor_endpoint_for_every_doctor_and_date' },
                    { name: 'test_booked_slots_are_left_out_and_cancelled_ones_come_back' },
                    { name: 'test_slots_under_an_hour_away_are_left_out_using_clinic_time' },
                    { name: 'test_from_can_be_a_later_date' }
                ]
            },
            {
                name: 'TestNextAvailable',
                tests: [
                    { name: 'test_earliest_free_slot_per_doctor_and_for_the_facility' },
                    { name: 'test_the_facility_takes_the_earliest_across_doctors' },
                    { name: 'test_null_when_nothing_is_free_in_the_range' },
                    { name: 'test_null_for_a_facility_without_doctors' }
                ]
            },
            {
                name: 'TestDoctors',
                tests: [
                    { name: 'test_only_active_doctors_by_name_including_one_without_hours' }
                ]
            },
            {
                name: 'TestErrors',
                tests: [
                    { name: 'test_404_for_an_unknown_facility' },
                    { name: 'test_404_for_an_inactive_facility' },
                    { name: 'test_400_for_days_out_of_range', cases: 4 },
                    { name: 'test_1_and_31_days_are_allowed' },
                    { name: 'test_400_for_a_date_before_today_at_the_facility' },
                    { name: 'test_422_for_values_that_arent_a_date_or_a_number', cases: 2 }
                ]
            },
            {
                name: 'TestQueries',
                tests: [
                    { name: 'test_count_does_not_grow_with_doctors_or_bookings' }
                ]
            },
            {
                name: 'TestFacilityList',
                tests: [
                    { name: 'test_each_facility_has_its_next_free_slot' },
                    { name: 'test_matches_the_facility_endpoint' },
                    { name: 'test_query_count_does_not_grow_with_facilities' }
                ]
            }
        ]
    },
    {
        file: 'test_logging.py',
        count: 14,
        groups: [
            {
                name: 'TestRequestId',
                tests: [
                    { name: 'test_each_response_carries_a_new_one' },
                    { name: 'test_the_callers_id_is_kept' },
                    { name: 'test_a_malformed_one_is_replaced', cases: 4 }
                ]
            },
            {
                name: 'TestAccessLog',
                tests: [
                    { name: 'test_one_line_per_request_with_its_ids_and_no_query_string' },
                    { name: 'test_lines_logged_while_handling_a_request_carry_its_ids' },
                    { name: 'test_a_failed_login_is_logged_without_the_email' }
                ]
            },
            {
                name: 'TestUnhandledError',
                tests: [
                    { name: 'test_is_a_500_with_the_request_id' },
                    { name: 'test_is_logged_with_its_traceback_and_an_error_access_line' }
                ]
            },
            {
                name: 'TestFormat',
                tests: [
                    { name: 'test_json_is_one_object_per_line_with_context_extras_and_traceback' },
                    { name: 'test_console_is_readable_with_the_fields_after_the_message' },
                    { name: 'test_configuring_again_keeps_one_handler' }
                ]
            }
        ]
    },
    {
        file: 'test_multi_clinic.py',
        count: 24,
        groups: [
            {
                name: 'TestSignIn',
                tests: [
                    { name: 'test_a_doctor_lists_every_facility_they_work_at' }
                ]
            },
            {
                name: 'TestBooking',
                tests: [
                    { name: 'test_the_facility_is_worked_out_from_the_doctors_hours' },
                    { name: 'test_naming_a_facility_the_doctor_isnt_at_then_is_refused' },
                    { name: 'test_a_facility_they_dont_work_at_is_not_found' },
                    { name: 'test_one_booking_blocks_the_same_time_at_every_facility' }
                ]
            },
            {
                name: 'TestAvailability',
                tests: [
                    { name: 'test_covers_every_facility_and_names_each_slots_facility' },
                    { name: 'test_one_facility_when_asked' },
                    { name: 'test_each_facilitys_page_uses_its_own_hours' },
                    { name: 'test_the_doctor_lists_every_facility_with_its_hours' }
                ]
            },
            {
                name: 'TestWorkingHours',
                tests: [
                    { name: 'test_hours_elsewhere_are_kept' },
                    { name: 'test_overlapping_another_facility_is_refused' },
                    { name: 'test_overlaps_are_checked_across_timezones' },
                    { name: 'test_a_facility_only_lists_its_own_hours' }
                ]
            },
            {
                name: 'TestStaff',
                tests: [
                    { name: 'test_adding_a_doctor_from_elsewhere_links_their_account' },
                    { name: 'test_adding_them_twice_is_a_conflict' },
                    { name: 'test_a_patient_or_another_facilitys_admin_cant_be_added' },
                    { name: 'test_each_facility_lists_the_doctor_as_they_are_there' },
                    { name: 'test_removing_them_from_one_facility_keeps_the_others' },
                    { name: 'test_re_adding_them_restores_the_facility' }
                ]
            },
            {
                name: 'TestPrivacy',
                tests: [
                    { name: 'test_each_facility_sees_only_its_own_appointments' },
                    { name: 'test_the_doctor_can_cancel_at_either_facility' },
                    { name: 'test_a_doctors_other_facility_admin_cant_set_hours_here' }
                ]
            },
            {
                name: 'TestReschedule',
                tests: [
                    { name: 'test_stays_at_the_same_facility' }
                ]
            },
            {
                name: '',
                tests: [
                    { name: 'test_shifts_compare_real_instants' }
                ]
            }
        ]
    },
    {
        file: 'test_rate_limit.py',
        count: 18,
        groups: [
            {
                name: 'TestCheck',
                tests: [
                    { name: 'test_allows_up_to_the_limit_then_blocks_for_a_minute' },
                    { name: 'test_each_further_block_is_longer_up_to_30_minutes' },
                    { name: 'test_requests_while_blocked_are_refused_without_extending_the_block' },
                    { name: 'test_being_blocked_is_remembered_for_an_hour' },
                    { name: 'test_after_strike_ttl_without_a_block_the_next_one_is_short_again' },
                    { name: 'test_the_window_slides' },
                    { name: 'test_identities_and_policies_are_counted_separately' },
                    { name: 'test_concurrent_requests_cannot_exceed_the_limit' },
                    { name: 'test_redis_holds_no_email_or_ip' },
                    { name: 'test_a_new_block_is_logged_once' },
                    { name: 'test_lets_requests_through_when_redis_is_down' },
                    { name: 'test_can_be_turned_off' }
                ]
            },
            {
                name: 'TestDependency',
                tests: [
                    { name: 'test_counts_per_signed_in_user' },
                    { name: 'test_counts_per_ip_when_signed_out_or_the_token_is_invalid' }
                ]
            },
            {
                name: 'TestApi',
                tests: [
                    { name: 'test_api_routes_share_the_limit_but_root_does_not_count' },
                    { name: 'test_login_blocks_one_account_after_five_attempts' },
                    { name: 'test_login_blocks_one_ip_after_twenty_attempts_across_accounts' },
                    { name: 'test_accept_invite_blocks_token_guessing' }
                ]
            }
        ]
    }
]
