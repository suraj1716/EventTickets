<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminContactController extends Controller
{
    public function index(Request $request)
    {
        $contacts = Contact::with(['department', 'category', 'product'])
            ->when($request->search, fn($q) =>
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%")
                  ->orWhere('reason', 'like', "%{$request->search}%")
            )
            ->when($request->filled('is_read'), fn($q) =>
                $q->where('is_read', $request->is_read === '1')
            )
            ->when($request->reason, fn($q) =>
                $q->where('reason', $request->reason)
            )
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $reasons = Contact::select('reason')
            ->distinct()
            ->whereNotNull('reason')
            ->pluck('reason')
            ->map(fn($r) => ['value' => $r, 'label' => ucfirst(str_replace('_', ' ', $r))])
            ->values();

        return Inertia::render('Admin/Contacts/Index', [
            'contacts' => $contacts,
            'filters'  => $request->only(['search', 'is_read', 'reason']),
            'reasons'  => $reasons,
            'flash'    => [
                'success' => session('success'),
                'error'   => session('error'),
            ],
        ]);
    }

    public function show(Contact $contact)
    {
        // Mark as read when viewed
        if (!$contact->is_read) {
            $contact->update(['is_read' => true]);
        }

        $contact->load(['department', 'category', 'product']);

        return Inertia::render('Admin/Contacts/Show', [
            'contact' => $contact,
            'flash'   => [
                'success' => session('success'),
                'error'   => session('error'),
            ],
        ]);
    }

    public function markRead(Contact $contact)
    {
        $contact->update(['is_read' => true]);
        return back()->with('success', 'Marked as read.');
    }

    public function markUnread(Contact $contact)
    {
        $contact->update(['is_read' => false]);
        return back()->with('success', 'Marked as unread.');
    }

    public function destroy(Contact $contact)
    {
        if ($contact->file_path) {
            \Storage::disk('public')->delete($contact->file_path);
        }
        $contact->delete();
        return back()->with('success', 'Contact deleted.');
    }
}
