import ErrorPage from "@/Pages/ErrorPage";
import { usePage } from "@inertiajs/react";

export default function Error() {
    const { statusCode, message } = usePage().props as unknown as {
        statusCode: number;
        message: string;
    };

    return <ErrorPage statusCode={statusCode} message={message} />;
}
