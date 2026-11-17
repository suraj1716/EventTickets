// resources/js/Pages/Admin/Events/FormDemo.tsx
// Renders your REAL Admin/Events/Form.tsx in "create new event" mode with
// random categories + venues (no `event` prop => create flow).
import EventForm from "./Form";
import { makeCategories, makeVenues } from "@/utils/demoEventData";

export default function EventFormDemo() {
  return <EventForm categories={makeCategories() as any} venues={makeVenues() as any} />;
}
