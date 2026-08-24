import React from "react";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(isSameOrAfter);

type AvailableSlotsProps = {
  date: string;               // selected date in YYYY-MM-DD format
  availableSlots: string[];   // array of slot strings like "5:30 pm - 6:00 pm"
  onSelect: (slot: string) => void;
  selectedSlot: string;
};

const AvailableSlots: React.FC<AvailableSlotsProps> = ({
  date,
  availableSlots,
  onSelect,
  selectedSlot,
}) => {
  const now = dayjs();
  const selectedDay = dayjs(date).startOf("day");
  const isToday = now.isSame(selectedDay, "day");

  // cutoff time = now + 2 hours
  const cutoffTime = now.add(2, "hour");

  const filteredSlots = availableSlots.filter((slot) => {
    if (!isToday) return true;

    const [startTime] = slot.split(" - ");
    const slotTime = dayjs(`${date} ${startTime}`, "YYYY-MM-DD h:mm a");

    // Include slots starting at or after cutoffTime
    return slotTime.isSameOrAfter(cutoffTime);
  });

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-2">Available Slots for {date}</h1>
      {filteredSlots.length > 0 ? (
        <ul className="space-y-2">
          {filteredSlots.map((slot, index) => (
            <li
              key={index}
              onClick={() => onSelect(slot)}
              className={`p-2 rounded cursor-pointer border ${
                selectedSlot === slot
                  ? "bg-green-600 text-white"
                  : "bg-green-200 hover:bg-green-300"
              }`}
            >
              {slot}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-red-500">No available slots for this day.</p>
      )}
    </div>
  );
};

export default AvailableSlots;
