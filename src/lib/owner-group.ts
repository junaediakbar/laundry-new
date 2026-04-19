/** Satukan tampilan untuk akun Owner: nama "Owner" atau role `owner`. */

export function isOwnerDisplayName(name: string) {
  return name.trim().toLowerCase() === "owner"
}

export function isOwnerRole(role: string | undefined | null) {
  return (role ?? "").trim().toLowerCase() === "owner"
}

/** Termasuk grup Owner (role owner atau nama Owner). */
export function inOwnerGroup(row: { name: string; role?: string }) {
  return isOwnerRole(row.role) || isOwnerDisplayName(row.name)
}

/**
 * Untuk viewer karyawan, API kadang mengosongkan `role` — hanya andalkan nama.
 */
export function inOwnerGroupForViewer(
  row: { name: string; role?: string },
  viewerRole: string | undefined,
) {
  if (isOwnerDisplayName(row.name)) return true
  if ((viewerRole ?? "").toLowerCase() !== "employee" && isOwnerRole(row.role)) return true
  return false
}

/** Baris performa yang tampil sebagai Owner (id di grup atau nama kolom). */
export function performanceRowIsOwnerLike(
  row: { employeeId: string; employeeName: string },
  ownerIds: Set<string>,
) {
  return ownerIds.has(row.employeeId) || isOwnerDisplayName(row.employeeName)
}
