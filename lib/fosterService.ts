import { collection, doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * FIX LOG
 * ───────
 * M5  — Changed task date format from full ISO string (e.g.
 *        "2026-04-13T00:00:00.000Z") to YYYY-MM-DD string (e.g.
 *        "2026-04-13"). UserCalendar filters tasks by comparing
 *        `task.date === today.toISOString().split("T")[0]` — so
 *        the stored format MUST be YYYY-MM-DD to match.
 *
 * NEW — startDate in the foster doc is also stored as YYYY-MM-DD
 *        for consistency with how the Inbox page stores it.
 *
 * NEW — Added durationDays to the foster document (was already
 *        a parameter but never set on the doc in some flows).
 */

type Task = {
  id: string;
  day: number;
  time: string;
  title: string;
  type: "one-off" | "daily";
};

/**
 * Formats a Date object as a YYYY-MM-DD string.
 * This is the canonical date format used across the app.
 */
function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const publishFosterCalendar = async (
  shelterId: string,
  userId: string,
  petId: string,
  startDate: Date,
  durationDays: number,
  uiTasks: Task[]
) => {
  try {
    // 1. Initialize a Batch Write
    const batch = writeBatch(db);

    // 2. Create the main Foster Agreement Document
    const fosterRef = doc(collection(db, "fosters"));

    batch.set(fosterRef, {
      shelterId,
      userId,
      petId,
      startDate: toDateString(startDate), // FIX M5: YYYY-MM-DD, not full ISO
      durationDays,
      status: "active",
      createdAt: new Date().toISOString(),
    });

    // 3. Generate and attach the Tasks to a Subcollection
    const tasksCollectionRef = collection(
      db,
      `fosters/${fosterRef.id}/tasks`
    );

    uiTasks.forEach((task) => {
      if (task.type === "one-off") {
        // Calculate the exact date for this specific day
        const taskDate = new Date(startDate);
        taskDate.setDate(taskDate.getDate() + (task.day - 1));

        const newTaskRef = doc(tasksCollectionRef);
        batch.set(newTaskRef, {
          title: task.title,
          time: task.time,
          date: toDateString(taskDate), // FIX M5: YYYY-MM-DD
          dayNumber: task.day,
          isCompleted: false,
        });
      } else if (task.type === "daily") {
        // If it's a daily task, create a document for each day
        for (let i = 0; i < durationDays; i++) {
          const taskDate = new Date(startDate);
          taskDate.setDate(taskDate.getDate() + i);

          const newTaskRef = doc(tasksCollectionRef);
          batch.set(newTaskRef, {
            title: task.title,
            time: task.time,
            date: toDateString(taskDate), // FIX M5: YYYY-MM-DD
            dayNumber: i + 1,
            isCompleted: false,
          });
        }
      }
    });

    // 4. Commit the Batch
    await batch.commit();
    console.log("Successfully published the 30-day calendar!");
    return true;
  } catch (error) {
    console.error("Error publishing calendar: ", error);
    return false;
  }
};