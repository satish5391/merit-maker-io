const KEY = "testprep.student-name";

export function getStudentName(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(KEY) ?? "";
}

export function setStudentName(name: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, name);
}
