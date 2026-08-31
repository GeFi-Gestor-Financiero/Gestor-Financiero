export const SUPPORTED_CURRENCIES = [
  'ARS','USD','EUR','GBP','BRL','MXN','CLP','COP','PEN','UYU','PYG','BOB','VES','CAD','AUD','NZD','JPY','CNY','HKD','KRW','INR','IDR','THB','MYR','SGD','PHP','VND','TWD','CHF','SEK','NOK','DKK','PLN','CZK','HUF','RON','TRY','UAH','RUB','ZAR','EGP','MAD','AED','SAR','QAR','ILS','KWD','BHD','OMR','PKR','BDT','LKR','NGN','KES','GHS','XOF','XAF','CRC','DOP','GTQ','HNL','NIO','PAB','JMD','TTD'
] as const;

export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];
