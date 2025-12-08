export function calculateAge(birthDateInput: Date | string | null | undefined): number | string {
  if (!birthDateInput) return '-';

  const today = new Date();
  const birthDate = new Date(birthDateInput);
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--; 
  }
  
  return age;
}