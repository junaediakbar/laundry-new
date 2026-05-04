/** Label singkat untuk task_type upah (performa karyawan & cetak) — selaras dengan template produksi */
const TASK_LABELS: Record<string, string> = {
  pickup_antar_jemput: "Antar jemput",
  pickup_driver: "Driver jemput",
  pickup_buruh_1: "Buruh jemput 1",
  pickup_buruh_2: "Buruh jemput 2",
  pickup_bensin: "Bensin jemput",
  pickup_worker_1: "Buruh jemput 1",
  pickup_worker_2: "Buruh jemput 2",
  pickup_fuel: "Bensin jemput",
  dropoff_antar_jemput: "Antar jemput",
  dropoff_driver: "Driver antar",
  dropoff_buruh_1: "Buruh antar 1",
  dropoff_buruh_2: "Buruh antar 2",
  dropoff_bensin: "Bensin antar",
  dropoff_worker_1: "Buruh antar 1",
  dropoff_worker_2: "Buruh antar 2",
  dropoff_fuel: "Bensin antar",
  rontok: "Rontok",
  dust_removal: "Rontok",
  sikat: "Sikat",
  brushing: "Sikat",
  bilas: "Bilas",
  rinse_sprayer: "Bilas",
  jemur: "Jemur",
  spin_dry: "Jemur",
  spin_dry_1: "Jemur",
  spin_dry_2: "Jemur",
  downy: "Downy",
  rumbai: "Rumbai",
  finishing_1: "Finishing 1",
  finishing_2: "Finishing 2",
  finishing_packing: "Finishing / packing",
}

export function labelEmployeePerformanceTask(taskType: string): string {
  const key = taskType.trim()
  return TASK_LABELS[key] ?? key.replace(/_/g, " ")
}
