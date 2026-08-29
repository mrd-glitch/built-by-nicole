import { getExercises } from "@/lib/data";
import { ExerciseEditor } from "@/components/ExerciseEditor";

export const dynamic = "force-dynamic";

export default async function ExerciseLibrary() {
  const exercises = await getExercises();
  return <ExerciseEditor initial={exercises} />;
}
