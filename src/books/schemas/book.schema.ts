import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type BookDocument = Book & Document;

@Schema()
export class Book {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop()
  author: string;

  @Prop()
  category: string;

  @Prop({ type: Number, min: 1, max: 5, default: null })
  rating: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  user: User | string;
}

export const BookSchema = SchemaFactory.createForClass(Book);