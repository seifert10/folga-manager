/**
 * Validação e formatação de CPF (apenas dígitos verificadores e formato, sem consulta externa)
 */
export function isValidCPF(cpf: string): boolean {
  if (!cpf) return false;
  const cleanCPF = cpf.replace(/\D/g, '');

  if (cleanCPF.length !== 11) return false;

  // Rejeita sequências repetidas como 111.111.111-11
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cleanCPF.charAt(9), 10)) return false;

  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cleanCPF.charAt(10), 10)) return false;

  return true;
}

export function formatCPF(cpf: string): string {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return cpf;
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Gera CPF fictício matematicamente válido para testes/seeds
 */
export function generateFakeValidCPF(seedNum: number): string {
  // Gera 9 dígitos baseados no seedNum
  const base = String(100000000 + (seedNum * 1234567) % 899999999).slice(0, 9);
  let sum1 = 0;
  for (let i = 0; i < 9; i++) {
    sum1 += parseInt(base.charAt(i), 10) * (10 - i);
  }
  let d1 = 11 - (sum1 % 11);
  if (d1 >= 10) d1 = 0;

  const baseWithD1 = base + d1;
  let sum2 = 0;
  for (let i = 0; i < 10; i++) {
    sum2 += parseInt(baseWithD1.charAt(i), 10) * (11 - i);
  }
  let d2 = 11 - (sum2 % 11);
  if (d2 >= 10) d2 = 0;

  return formatCPF(baseWithD1 + d2);
}
