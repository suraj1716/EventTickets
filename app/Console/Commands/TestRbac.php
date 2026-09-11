<?php

namespace App\Console\Commands;

use App\Models\Event;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Gate;
use Spatie\Permission\PermissionRegistrar;

class TestRbac extends Command
{
    protected $signature = 'rbac:test';

    protected $description = 'Creates throwaway test users/events and verifies the vendor/staff RBAC setup works, then reports pass/fail for each check.';

    protected int $passed = 0;
    protected int $failed = 0;

    public function handle(): int
    {
        $registrar = app(PermissionRegistrar::class);

        $this->info('Creating test data...');

        $vendorA = User::factory()->create();
        $vendorA->assignRole('vendor');

        $vendorB = User::factory()->create();
        $vendorB->assignRole('vendor');

        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $staff = User::factory()->create();
        $registrar->setPermissionsTeamId($vendorA->id);
        $staff->assignRole('staff');
        $staff->vendors()->attach($vendorA->id, ['status' => 'active']);

        $eventA = Event::factory()->create(['vendor_user_id' => $vendorA->id]);
        $eventB = Event::factory()->create(['vendor_user_id' => $vendorB->id]);

        $this->newLine();
        $this->info('Running checks...');
        $this->newLine();

        // --- Vendor scoping ---
        $registrar->setPermissionsTeamId($vendorA->id);
        $this->check(
            'Vendor A can update their own event',
            Gate::forUser($vendorA)->allows('update', $eventA) === true
        );
        $this->check(
            'Vendor A CANNOT update vendor B\'s event',
            Gate::forUser($vendorA)->allows('update', $eventB) === false
        );

        // --- Staff scoping, team A active ---
        $registrar->setPermissionsTeamId($vendorA->id);
        $this->check(
            'Staff (team=A) has events.update permission',
            $staff->can('events.update') === true
        );
        $this->check(
            'Staff (team=A) can update event A via policy',
            Gate::forUser($staff)->allows('update', $eventA) === true
        );
        $this->check(
            'Staff (team=A) CANNOT update event B via policy',
            Gate::forUser($staff)->allows('update', $eventB) === false
        );
        $this->check(
            'Staff CANNOT delete events (not granted to staff role)',
            Gate::forUser($staff)->allows('delete', $eventA) === false
        );
        $this->check(
            'Staff CANNOT publish events (not granted to staff role)',
            Gate::forUser($staff)->allows('publish', $eventA) === false
        );

        // --- Staff scoping, switched to team B (never assigned there) ---
        $registrar->setPermissionsTeamId($vendorB->id);
        $this->check(
            'Staff (team switched to B, no role there) loses events.update',
            $staff->can('events.update') === false
        );

        // --- Now grant staff role under team B too, confirm multi-vendor works ---
        $staff->assignRole('staff');
        $staff->vendors()->attach($vendorB->id, ['status' => 'active']);

        $registrar->setPermissionsTeamId($vendorB->id);
        $this->check(
            'Staff (now also team=B) can update event B via policy',
            Gate::forUser($staff)->allows('update', $eventB) === true
        );
        $this->check(
            'Staff (team=B) still CANNOT update event A via policy',
            Gate::forUser($staff)->allows('update', $eventA) === false
        );

        $registrar->setPermissionsTeamId($vendorA->id);
        $this->check(
            'Switching back to team=A, staff can update event A again',
            Gate::forUser($staff)->allows('update', $eventA) === true
        );

        // --- Admin bypass ---
        $this->check(
            'Admin can delete ANY event without explicit permission scoping',
            Gate::forUser($admin)->allows('delete', $eventB) === true
        );
        $this->check(
            'Admin can publish ANY event',
            Gate::forUser($admin)->allows('publish', $eventA) === true
        );

        $this->newLine();
        $this->cleanup($vendorA, $vendorB, $admin, $staff, $eventA, $eventB);

        $this->newLine();
        $this->info("Results: {$this->passed} passed, {$this->failed} failed.");

        return $this->failed === 0 ? self::SUCCESS : self::FAILURE;
    }

    protected function check(string $label, bool $condition): void
    {
        if ($condition) {
            $this->passed++;
            $this->line("  <fg=green>PASS</>  {$label}");
        } else {
            $this->failed++;
            $this->line("  <fg=red>FAIL</>  {$label}");
        }
    }

    protected function cleanup(User $vendorA, User $vendorB, User $admin, User $staff, Event $eventA, Event $eventB): void
    {
        $this->info('Cleaning up test data...');

        $eventA->delete();
        $eventB->delete();
        $staff->vendors()->detach();
        $staff->delete();
        $vendorA->delete();
        $vendorB->delete();
        $admin->delete();
    }
}
