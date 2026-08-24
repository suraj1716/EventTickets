import Button from '@/Components/App/ui/Button';
import { label, input, err } from '@/Components/App/formStyles';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Confirm Password" />

            <div style={{ marginBottom: 16, fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                This is a secure area of the application. Please confirm your
                password before continuing.
            </div>

            <form onSubmit={submit}>
                <div style={{ marginTop: 16 }}>
                    <label style={label} htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        style={input}
                        value={data.password}
                        autoFocus
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    {errors.password && <p style={err}>{errors.password}</p>}
                </div>

                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <Button variant="primary" disabled={processing}>
                        Confirm
                    </Button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
