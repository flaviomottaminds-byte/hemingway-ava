/**
 * Normaliza e resolve o papel do usuário (role) garantindo que valores reais
 * do banco de dados Supabase (admin, administrator, teacher, professor, student, aluno, etc.)
 * sejam lidos e respeitados com precisão no frontend, sem qualquer lógica fixa
 * que force o usuário existente como 'student'.
 */
export const resolveUserRole = (rawRole: unknown): 'admin' | 'teacher' | 'student' => {
  if (!rawRole) return 'student'
  const normalized = String(rawRole).trim().toLowerCase()

  // Reconhece variações de Admin / Administrador
  if (
    normalized === 'admin' ||
    normalized === 'administrator' ||
    normalized === 'administrador' ||
    normalized === 'superadmin' ||
    normalized === 'master' ||
    normalized === 'gestor' ||
    normalized === 'gerente' ||
    normalized.includes('admin')
  ) {
    return 'admin'
  }

  // Reconhece variações de Professor / Docente / Coordenador
  if (
    normalized === 'teacher' ||
    normalized === 'professor' ||
    normalized === 'professora' ||
    normalized === 'docente' ||
    normalized === 'instructor' ||
    normalized === 'instrutor' ||
    normalized === 'coordinator' ||
    normalized === 'coordenador'
  ) {
    return 'teacher'
  }

  return 'student'
}
