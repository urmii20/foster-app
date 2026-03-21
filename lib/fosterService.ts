import { collection, doc, writeBatch } from "firebase/firestore"; 
import { db } from "@/lib/firebase"; // Your firebase config file

// The data types based on our previous step
type Task = { id: string; day: number; time: string; title: string; type: 'one-off' | 'daily' };

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
    // This goes in the main "fosters" collection
    const fosterRef = doc(collection(db, "fosters")); 
    
    batch.set(fosterRef, {
      shelterId,
      userId,
      petId,
      startDate: startDate.toISOString(),
      durationDays,
      status: "active",
      createdAt: new Date().toISOString()
    });

    // 3. Generate and attach the Tasks to a Subcollection
    const tasksCollectionRef = collection(db, `fosters/${fosterRef.id}/tasks`);

    uiTasks.forEach((task) => {
      if (task.type === 'one-off') {
        // Calculate the exact date for this specific day
        const taskDate = new Date(startDate);
        taskDate.setDate(taskDate.getDate() + (task.day - 1));

        const newTaskRef = doc(tasksCollectionRef);
        batch.set(newTaskRef, {
          title: task.title,
          time: task.time,
          date: taskDate.toISOString(),
          dayNumber: task.day,
          isCompleted: false
        });

      } else if (task.type === 'daily') {
        // If it's a daily task, loop through all 30 days and create a document for each day
        for (let i = 0; i < durationDays; i++) {
          const taskDate = new Date(startDate);
          taskDate.setDate(taskDate.getDate() + i);

          const newTaskRef = doc(tasksCollectionRef);
          batch.set(newTaskRef, {
            title: task.title,
            time: task.time,
            date: taskDate.toISOString(),
            dayNumber: i + 1,
            isCompleted: false
          });
        }
      }
    });

    // 4. Commit the Batch (Saves everything to Firebase instantly)
    await batch.commit();
    console.log("Successfully published the 30-day calendar!");
    return true;

  } catch (error) {
    console.error("Error publishing calendar: ", error);
    return false;
  }
};