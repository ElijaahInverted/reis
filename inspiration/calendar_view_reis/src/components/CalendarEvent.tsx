import { MapPin } from "lucide-react";

interface CalendarEventProps {
  title: string;
  startTime: string;
  endTime: string;
  style: {
    top: string;
    height: string;
  };
  organizer?: string;
  tentative?: boolean;
  type?: "lecture" | "exercise" | "other";
  location?: string;
}

export function CalendarEvent({
  title,
  startTime,
  endTime,
  style,
  organizer,
  tentative,
  type = "other",
  location,
}: CalendarEventProps) {
  // Calculate duration in minutes
  const calculateDuration = () => {
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const [endHours, endMinutes] = endTime.split(":").map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    return endTotalMinutes - startTotalMinutes;
  };

  const duration = calculateDuration();
  const isLongEnough = duration >= 60; // Only show location if event is 1 hour or longer

  // Determine colors based on type
  const getColors = () => {
    if (type === "lecture") {
      // Green for lectures (př.)
      return {
        bg: "rgba(165, 214, 167, 0.9)",
        border: "rgba(165, 214, 167, 0.9)",
        leftBorder: "rgba(76, 175, 80, 1)",
      };
    } else if (type === "exercise") {
      // Blue for exercises (cv.)
      return {
        bg: "rgba(144, 202, 249, 0.9)",
        border: "rgba(144, 202, 249, 0.9)",
        leftBorder: "rgba(33, 150, 243, 1)",
      };
    } else {
      // Pink for other events
      return {
        bg: "rgba(241, 183, 187, 0.9)",
        border: "rgba(241, 183, 187, 0.9)",
        leftBorder: "rgba(180, 100, 110, 1)",
      };
    }
  };

  const colors = getColors();

  // Split title into code and rest
  const spaceIndex = title.indexOf(" ");
  const courseCode = spaceIndex > 0 ? title.substring(0, spaceIndex) : title;
  const courseTitle = spaceIndex > 0 ? title.substring(spaceIndex + 1) : "";

  return (
    <div
      className="absolute left-1 right-1 rounded overflow-hidden cursor-pointer"
      style={{
        top: style.top,
        height: style.height,
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        borderLeft: tentative ? `4px dashed ${colors.leftBorder}` : `4px solid ${colors.leftBorder}`,
      }}
    >
      <div className="p-1 h-full flex flex-col text-xs overflow-hidden">
        <div className="text-gray-900 flex-shrink-0">
          <div className="font-semibold">{courseCode}</div>
          {courseTitle && <div className="break-words line-clamp-2">{courseTitle}</div>}
        </div>
        {organizer && (
          <div className="text-gray-700 text-xs truncate flex-shrink-0">{organizer}</div>
        )}
        {isLongEnough && location && (
          <div className="text-gray-700 text-xs mt-auto flex-shrink-0">
            {location}
          </div>
        )}
      </div>
    </div>
  );
}