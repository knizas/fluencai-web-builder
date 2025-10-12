export type Project = {
  id: string
  name: string
  html: string
  prompt?: string
  thumbnail?: string
  updatedAt: number
}

const KEY = 'fluencai.projects'

/* ---------- Storage helpers ---------- */
function read(): Record<string, Project> {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function write(map: Record<string, Project>) {
  localStorage.setItem(KEY, JSON.stringify(map))
}

/* ---------- CRUD operations ---------- */
export function newId() {
  return Math.random().toString(36).slice(2, 10)
}

export function getProject(id: string): Project | null {
  const map = read()
  return map[id] || null
}

export function upsertProject(p: Project) {
  const map = read()
  map[p.id] = p
  write(map)
}

export function listProjects(): Project[] {
  const map = read()
  return Object.values(map).sort((a, b) => b.updatedAt - a.updatedAt)
}

export function deleteProject(id: string) {
  const map = read()
  if (map[id]) {
    delete map[id]
    write(map)
  }
}

/* ---------- New: Rename project ---------- */
export function updateProjectName(id: string, newName: string) {
  const map = read()
  const project = map[id]
  if (project) {
    project.name = newName?.trim() || 'Untitled'
    project.updatedAt = Date.now()
    write(map)
  }
}
