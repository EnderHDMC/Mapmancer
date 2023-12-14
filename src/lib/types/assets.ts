import type { Asset, SpriteData, Shader, SoundData } from 'kaboom';

type Atlas = Record<string, SpriteData>;

type atlasAsset = Asset<Atlas>;
type shaderAsset = Asset<Shader>;
type soundAsset = Asset<SoundData>;

export type { Atlas, atlasAsset, shaderAsset, soundAsset };
