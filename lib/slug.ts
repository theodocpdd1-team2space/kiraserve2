export function createSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function createUniqueChurchSlug(
  db: {
    church: {
      findUnique: (args: {
        where: { slug: string };
        select: { id: true };
      }) => Promise<{ id: string } | null>;
    };
  },
  churchName: string
) {
  const baseSlug = createSlug(churchName) || "church";
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existingChurch = await db.church.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existingChurch) return slug;

    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }
}