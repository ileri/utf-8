import stringToCodePointArray from 'string-to-code-point-array'

const bmpEnd = 0xffff

export function validate (bytes) {
  const length = bytes.length

  if (!length || length > 4) {
    return false
  }

  if (length === 1) {
    return bytes[0] >> 7 === 0
  }

  for (let i = 1; i < length; ++i) {
    if ((bytes[i] >> 6) !== 0b10) {
      return false
    }
  }

  const flags = (1 << length + 1) - 1
  return ((bytes[0] >> (7 - length)) & flags) === (flags - 1)
}

export function fromCodePoint (codePoint) {
  if (typeof codePoint !== 'number') {
    throw new TypeError('utf8.fromCodePoint: Code point has to be a number')
  }
  if (codePoint < 0) {
    throw new RangeError('utf8.fromCodePoint: Code point can not be lower than 0')
  }
  if (codePoint > 0x10FFFF) {
    throw new RangeError('utf8.fromCodePoint: Code point can not be higher than 0x10FFFF')
  }

  if (codePoint <= 0x7F) {
    return new Uint8Array([codePoint])
  }

  const bytesLength = codePoint > bmpEnd ? 4 : (codePoint > 0x7ff ? 3 : 2)
  const bytes = new Array(bytesLength)

  for (let i = bytesLength - 1; i >= 1; --i) {
    bytes[i] = (0b10000000 | (0b111111 & codePoint))
    codePoint = codePoint >> 6
  }
  bytes[0] = (((1 << (bytesLength)) - 1) << 8 - bytesLength) | codePoint

  return new Uint8Array(bytes)
}

export function toCodePoint (bytes) {
  var codePoint

  if (!Array.isArray(bytes) && !(bytes instanceof Uint8Array)) {
    throw new TypeError('utf8.toCodePoint: Expects Array or Uint8Array')
  }
  if (!validate(bytes)) {
    throw new Error('utf8.toCodePoint: Invalid utf8 array supplied')
  }

  const length = bytes.length

  if (length === 1) {
    return bytes[0]
  }

  codePoint = (bytes[0] & ((1 << (8 - length)) - 1)) << ((length - 1) * 6)
  for (let i = 1; i < length; ++i) {
    codePoint += (bytes[i] & ((1 << 7) - 1)) << ((length - i - 1) * 6)
  }

  return codePoint
}

export function fromChr (chr) {
  if (typeof chr !== 'string') {
    throw new TypeError('utf8.fromChr: Expects argument 0 to be a string')
  }

  if (!chr.length || (chr.codePointAt(0) <= bmpEnd ? chr.length !== 1 : chr.length !== 2)) {
    throw new RangeError('utf8.fromChr: Character must have a length of 1')
  }

  return fromCodePoint(chr.codePointAt(0))
}

export function toChr (bytes) {
  return String.fromCodePoint(toCodePoint(bytes))
}

export function parse (string) {
  return stringToCodePointArray(string).map(fromCodePoint)
}

export function stringify (bytes) {
  return bytes.map(toChr).join('')
}
