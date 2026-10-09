/** The warehouse operator's three sections, in order — shared by the employee layout and the
 * full-screen map page (which has no layout chrome, so it draws the same tabs over the map). */
export const useOperatorTabs = () => [
  { route: '/app/employee/label-scans', label: 'Dashboard' },
  { route: '/app/employee/map', label: 'Map' },
  { route: '/app/employee/drop-off-receipts', label: 'Drop-offs' },
]
