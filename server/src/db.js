import mongoose from 'mongoose';

export async function connect(uri) {
  await mongoose.connect(uri);
  return mongoose.connection;
}

export async function disconnect() {
  await mongoose.disconnect();
}
