import { Badge } from "@/components/ui/Badge";

export type NoteListItem = {
  name: string;
  noteType: string;
  intensity: number | null;
};

const orderedTypes = ["TOP", "HEART", "BASE"];

export function NotesList({ notes }: { notes: NoteListItem[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {orderedTypes.map((type) => {
        const items = notes.filter((note) => note.noteType === type);

        return (
          <div key={type} className="rounded-2xl border border-[#ddcfbc] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a7763]">
              {type.toLowerCase()} notes
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {items.map((item) => (
                <Badge key={`${type}-${item.name}`} variant="outline">
                  {item.name}
                  {item.intensity ? ` ${item.intensity}/10` : ""}
                </Badge>
              ))}
              {items.length === 0 ? <p className="text-sm text-[#6b5948]">No notes listed</p> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
