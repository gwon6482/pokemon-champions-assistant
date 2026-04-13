import mongoose from 'mongoose'

// ─── Pokemon ────────────────────────────────────────────────────────────────
const pokemonSchema = new mongoose.Schema({
  nationalId: { type: Number, required: true, unique: true },
  name: {
    ko: { type: String, required: true },
    en: { type: String, required: true }
  },
  types: {
    type: [String],
    validate: v => v.length >= 1 && v.length <= 2
  },
  imageUrl: String,
  spriteUrl: String,
  baseStats: {
    hp:      { type: Number, default: 0 },
    attack:  { type: Number, default: 0 },
    defense: { type: Number, default: 0 },
    spAtk:   { type: Number, default: 0 },
    spDef:   { type: Number, default: 0 },
    speed:   { type: Number, default: 0 }
  },
  abilities: [{
    nameKo: String,
    nameEn: String,
    isHidden: Boolean
  }],
  moves: [{
    nameKo: String,
    nameEn: String,
    type: String,
    damageClass: String, // physical / special / status
    power: Number,
    pp: Number
  }],
  availableInChampions: { type: Boolean, default: true }
}, { timestamps: true })

pokemonSchema.index({ 'name.ko': 'text', 'name.en': 'text' })
pokemonSchema.index({ types: 1 })
pokemonSchema.index({ availableInChampions: 1 })

// ─── MyRoster ───────────────────────────────────────────────────────────────
const rosterSchema = new mongoose.Schema({
  slotIndex: { type: Number, required: true, min: 0, max: 5 },
  pokemonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pokemon', required: true },
  nickname: { type: String, default: '' },
  nature: { type: String, default: '' },
  ability: { type: String, default: '' },
  heldItem: { type: String, default: '' },
  moves: { type: [String], default: [] },
  evTraining: {
    hp:      { type: Number, default: 0 },
    attack:  { type: Number, default: 0 },
    defense: { type: Number, default: 0 },
    spAtk:   { type: Number, default: 0 },
    spDef:   { type: Number, default: 0 },
    speed:   { type: Number, default: 0 }
  }
}, { timestamps: true })

// ─── BattleRecord ───────────────────────────────────────────────────────────
const battleRecordSchema = new mongoose.Schema({
  mode: { type: String, enum: ['single', 'double'], required: true },
  myParty:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pokemon' }],
  myCombo:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pokemon' }],
  opponentParty: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pokemon' }],
  opponentCombo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pokemon' }],
  result: { type: String, enum: ['win', 'lose', 'draw'], required: true },
  note: { type: String, default: '' }
}, { timestamps: true })

export const Pokemon = mongoose.models.Pokemon || mongoose.model('Pokemon', pokemonSchema)
export const MyRoster = mongoose.models.MyRoster || mongoose.model('MyRoster', rosterSchema)
export const BattleRecord = mongoose.models.BattleRecord || mongoose.model('BattleRecord', battleRecordSchema)
