/**
 * Normaliza e resolve o papel do usuário (role) garantindo que valores reais
 * do banco de dados Supabase (admin, administrator, teacher, professor, student, aluno, etc.)
 * sejam lidos e respeitados com máxima precisão no frontend, sem qualquer lógica fixa
 * que force o usuário existente como 'student'.
 */
export const resolveUserRole = (rawRole: unknown): 'admin' | 'teacher' | 'student' => {
  if (rawRole === null || rawRole === undefined) return 'student'

  // Se for booleano (ex: is_admin = true)
  if (typeof rawRole === 'boolean') {
    return rawRole ? 'admin' : 'student'
  }

  // Se for array (ex: roles = ['admin'] ou app_metadata.roles)
  if (Array.isArray(rawRole)) {
    if (rawRole.some((item) => resolveUserRole(item) === 'admin')) return 'admin'
    if (rawRole.some((item) => resolveUserRole(item) === 'teacher')) return 'teacher'
    return 'student'
  }

  // Se for objeto (ex: { role: 'admin' }, { name: 'admin' }, etc.)
  if (typeof rawRole === 'object') {
    const obj = rawRole as Record<string, unknown>
    const candidate =
      obj.role ??
      obj.user_role ??
      obj.perfil ??
      obj.tipo ??
      obj.type ??
      obj.name ??
      obj.cargo ??
      obj.is_admin ??
      obj.isAdmin
    if (candidate !== undefined && candidate !== rawRole) {
      return resolveUserRole(candidate)
    }
  }

  const normalized = String(rawRole).trim().toLowerCase()

  // Reconhece todas as variações de Admin / Administrador / Gestor / Diretor
  if (
    normalized === 'admin' ||
    normalized === 'administrator' ||
    normalized === 'administrador' ||
    normalized === 'administradora' ||
    normalized === 'superadmin' ||
    normalized === 'super_admin' ||
    normalized === 'master' ||
    normalized === 'gestor' ||
    normalized === 'gestora' ||
    normalized === 'gerente' ||
    normalized === 'diretor' ||
    normalized === 'diretora' ||
    normalized === 'director' ||
    normalized.includes('admin')
  ) {
    return 'admin'
  }

  // Reconhece todas as variações de Professor / Docente / Coordenador / Instrutor
  if (
    normalized === 'teacher' ||
    normalized === 'professor' ||
    normalized === 'professora' ||
    normalized === 'docente' ||
    normalized === 'instructor' ||
    normalized === 'instrutor' ||
    normalized === 'instrutora' ||
    normalized === 'coordinator' ||
    normalized === 'coordenador' ||
    normalized === 'coordenadora' ||
    normalized.includes('teach') ||
    normalized.includes('prof')
  ) {
    return 'teacher'
  }

  return 'student'
}
