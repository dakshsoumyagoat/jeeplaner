import { createFileRoute } from "@tanstack/react-router";
import { SchoolTimetable } from "@/components/timetable/SchoolTimetable";

export const Route = createFileRoute("/schedule")({
  head: () => ({
    meta: [
      { title: "Schedule — JEE Scholar Planner" },
      { name: "description", content: "Your weekly school schedule with editable time slots." },
    ],
  }),
  component: SchedulePage,
});

function SchedulePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold md:text-4xl">School schedule</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Edit class details and rename time slots to match your school day.
        </p>
      </header>
      <SchoolTimetable />
    </div>
  );
}