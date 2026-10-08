export function Fab({ icon: Icon, onClick, children, detail }) {
  return (
    <button type="button" className={`fab ${detail ? 'fab--detail' : ''}`} onClick={onClick}>
      {Icon && <Icon size={22} aria-hidden />}
      {children}
    </button>
  )
}
