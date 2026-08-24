// resources/js/types/InertiaPage.ts
// Reusable type for any page component that uses Inertia's persistent
// layout pattern (Component.layout = (page) => <SomeLayout>{page}</SomeLayout>).
// Import this instead of typing pages as plain React.FC.

import { ReactNode } from "react";

export type InertiaPage<P = {}> = React.FC<P> & {
  layout?: (page: ReactNode) => ReactNode;
};
