import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

import Button from '@/Components/App/ui/Button';
import { label, input, err } from '@/Components/App/formStyles';

export default function UpdateProfileInformation({
  mustVerifyEmail,
  status,
  className = "",
}: {
  mustVerifyEmail: boolean;
  status?: string;
  className?: string;
}) {
  const user = usePage().props.auth.user;

  const { data, setData, patch, errors, processing, recentlySuccessful } =
    useForm({
      name: user.name,
      email: user.email,
    });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    patch(route("profile.update"));
  };

  return (
    <form onSubmit={submit} className={className} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label style={label} htmlFor="name">Name</label>
        <input
          id="name"
          style={input}
          value={data.name}
          onChange={(e) => setData("name", e.target.value)}
          required
          autoFocus
          autoComplete="name"
        />
        {errors.name && <p style={err}>{errors.name}</p>}
      </div>

      <div>
        <label style={label} htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          style={input}
          value={data.email}
          onChange={(e) => setData("email", e.target.value)}
          required
          autoComplete="username"
        />
        {errors.email && <p style={err}>{errors.email}</p>}
      </div>

      {mustVerifyEmail && user.email_verified_at === null && (
        <div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--color-text-muted)" }}>
            Your email address is unverified.{" "}
            <Link
              href={route("verification.send")}
              method="post"
              as="button"
              style={{ textDecoration: "underline", color: "var(--color-primary)" }}
            >
              Click here to re-send the verification email.
            </Link>
          </p>
          {status === "verification-link-sent" && (
            <p style={{ marginTop: 6, fontSize: "12px", fontWeight: 500, color: "var(--color-success)" }}>
              A new verification link has been sent to your email address.
            </p>
          )}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Button type="submit" variant="primary" disabled={processing}>Save</Button>
        <Transition
          show={recentlySuccessful}
          enter="transition ease-in-out"
          enterFrom="opacity-0"
          leave="transition ease-in-out"
          leaveTo="opacity-0"
        >
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Saved.</span>
        </Transition>
      </div>
    </form>
  );
}
