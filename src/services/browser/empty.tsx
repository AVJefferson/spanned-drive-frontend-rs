export default function EmptyLocalStorage() {
  localStorage.clear();
  sessionStorage.clear();
  return true;
}
