import Modal from '@/Components/App/ui/Modal';
import Button from '@/Components/App/ui/Button';
import { label as labelStyle, input as inputStyle, err } from '@/Components/App/formStyles';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';

export default function DeleteUserForm({
    className = '',
}: {
    className?: string;
}) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser: FormEventHandler = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <section className={className}>
            <header>
                <h3
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 400,
                        fontSize: 'var(--text-xl)',
                        color: 'var(--color-text)',
                    }}
                >
                    Delete Account
                </h3>
                <p style={{ marginTop: 4, fontSize: 'var(--text-sm)' }}>
                    Once your account is deleted, all of its resources and data
                    will be permanently deleted. Before deleting your account,
                    please download any data or information that you wish to
                    retain.
                </p>
            </header>

            <div style={{ marginTop: 16 }}>
                <Button variant="danger" onClick={confirmUserDeletion}>
                    Delete Account
                </Button>
            </div>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} style={{ padding: 32 }}>
                    <h3
                        style={{
                            fontFamily: 'var(--font-display)',
                            fontWeight: 400,
                            fontSize: 'var(--text-lg)',
                            color: 'var(--color-text)',
                        }}
                    >
                        Are you sure you want to delete your account?
                    </h3>

                    <p style={{ marginTop: 6, fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                        Once your account is deleted, all of its resources and
                        data will be permanently deleted. Please enter your
                        password to confirm you would like to permanently delete
                        your account.
                    </p>

                    <div style={{ marginTop: 24 }}>
                        <label style={labelStyle} htmlFor="password" className="sr-only">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            style={{ ...inputStyle, width: '75%' }}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            autoFocus
                            placeholder="Password"
                        />
                        {errors.password && <p style={err}>{errors.password}</p>}
                    </div>

                    <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                        <Button variant="ghost" onClick={closeModal}>
                            Cancel
                        </Button>
                        <Button variant="danger" disabled={processing}>
                            Delete Account
                        </Button>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
