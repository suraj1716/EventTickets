import { FormEventHandler, useRef } from "react";
import { useForm } from "@inertiajs/react";
import { Transition } from "@headlessui/react";

import Button from "@/Components/App/ui/Button";
import { label, input, err } from "@/Components/App/formStyles";

export default function UpdatePasswordForm({
  className = "",
}: {
  className?: string;
}) {
  const passwordInput = useRef<HTMLInputElement>(null);
  const currentPasswordInput = useRef<HTMLInputElement>(null);

  const { data, setData, errors, put, reset, processing, recentlySuccessful } =
    useForm({
      current_password: "",
      password: "",
      password_confirmation: "",
    });

  const updatePassword: FormEventHandler = (e) => {
    e.preventDefault();

    put(route("password.update"), {
      preserveScroll: true,
      onSuccess: () => reset(),
      onError: (errors) => {
        if (errors.password) {
          reset("password", "password_confirmation");
          passwordInput.current?.focus();
        }
        if (errors.current_password) {
          reset("current_password");
          currentPasswordInput.current?.focus();
        }
      },
    });
  };

  return (
    <form
      onSubmit={updatePassword}
      className={className}
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <div>
        <label style={label} htmlFor="current_password">
          Current Password
        </label>
        <input
          id="current_password"
          ref={currentPasswordInput}
          type="password"
          style={input}
          value={data.current_password}
          onChange={(e) => setData("current_password", e.target.value)}
          autoComplete="current-password"
        />
        {errors.current_password && <p style={err}>{errors.current_password}</p>}
      </div>

      <div>
        <label style={label} htmlFor="password">
          New Password
        </label>
        <input
          id="password"
          ref={passwordInput}
          type="password"
          style={input}
          value={data.password}
          onChange={(e) => setData("password", e.target.value)}
          autoComplete="new-password"
        />
        {errors.password && <p style={err}>{errors.password}</p>}
      </div>

      <div>
        <label style={label} htmlFor="password_confirmation">
          Confirm Password
        </label>
        <input
          id="password_confirmation"
          type="password"
          style={input}
          value={data.password_confirmation}
          onChange={(e) => setData("password_confirmation", e.target.value)}
          autoComplete="new-password"
        />
        {errors.password_confirmation && (
          <p style={err}>{errors.password_confirmation}</p>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Button type="submit" variant="primary" disabled={processing}>
          Save
        </Button>

        <Transition
          show={recentlySuccessful}
          enter="transition ease-in-out"
          enterFrom="opacity-0"
          leave="transition ease-in-out"
          leaveTo="opacity-0"
        >
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
            Saved.
          </span>
        </Transition>
      </div>
    </form>
  );
}
