/**
 * Convert number to Indian Currency Words (Rupees and Paise)
 */
export function numberToIndianWords(amount: number): string {
  if (amount === 0) return 'Rupees Zero Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertBelowThousand(n: number): string {
    let str = '';
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n > 0) {
      if (n < 20) {
        str += a[n] + ' ';
      } else {
        str += b[Math.floor(n / 10)] + ' ';
        if (n % 10 > 0) {
          str += a[n % 10] + ' ';
        }
      }
    }
    return str.trim();
  }

  const roundedAmount = Math.round(amount * 100) / 100;
  const wholePart = Math.floor(roundedAmount);
  const paisePart = Math.round((roundedAmount - wholePart) * 100);

  let num = wholePart;
  let words = '';

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const remaining = num;

  if (crore > 0) {
    words += convertBelowThousand(crore) + ' Crore ';
  }
  if (lakh > 0) {
    words += convertBelowThousand(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    words += convertBelowThousand(thousand) + ' Thousand ';
  }
  if (remaining > 0) {
    words += convertBelowThousand(remaining) + ' ';
  }

  let result = 'Rupees ' + words.trim();
  if (paisePart > 0) {
    result += ' and ' + convertBelowThousand(paisePart) + ' Paise';
  }
  result += ' Only';

  return result.replace(/\s+/g, ' ').trim();
}
