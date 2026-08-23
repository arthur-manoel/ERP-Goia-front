export const digits=value=>String(value||'').replace(/\D/g,'')
export function formatCPF(value){const v=digits(value).slice(0,11);return v.replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2')}
export function formatCNPJ(value){const v=digits(value).slice(0,14);return v.replace(/(\d{2})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1/$2').replace(/(\d{4})(\d{1,2})$/,'$1-$2')}
export function formatDocument(value){return digits(value).length<=11?formatCPF(value):formatCNPJ(value)}
export function formatPhone(value){const v=digits(value).slice(0,11);return v.length>10?v.replace(/(\d{2})(\d{5})(\d{1,4})/,'($1) $2-$3'):v.replace(/(\d{2})(\d{4})(\d{1,4})/,'($1) $2-$3')}
export function formatField(name,type,value){const key=String(name||'').toLowerCase();if(key.includes('cnpj'))return formatCNPJ(value);if(key.includes('cpf')||key.includes('documento'))return formatDocument(value);if(key.includes('telefone')||key.includes('celular'))return formatPhone(value);return value}
export function friendlyError(message){return /\b(api|sql|column|table|trigger|constraint|foreign key|database)\b/i.test(String(message||''))?'Não foi possível concluir esta operação. Verifique os dados informados e tente novamente.':message}
