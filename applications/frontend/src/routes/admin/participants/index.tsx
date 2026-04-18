import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/participants/")({
    beforeLoad: () => {
        throw redirect({ to: "/admin" });
    },
});
