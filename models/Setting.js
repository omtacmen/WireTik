import mongoose from 'mongoose';

const SettingSchema = new mongoose.Schema({
  key: { type: String, default: 'global_settings' },
  endpoint: String,
  port: String
});

export default mongoose.models.Setting || mongoose.model('Setting', SettingSchema);