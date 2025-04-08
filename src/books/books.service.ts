import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateBookDto } from './dto/create-book.dto';
import { Book, BookDocument } from './schemas/book.schema';

@Injectable()
export class BooksService {
  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
  ) {}

  async create(createBookDto: CreateBookDto, userId: string): Promise<Book> {
    const newBook = new this.bookModel({
      ...createBookDto,
      user: userId,
    });
    return await newBook.save();
  }

  async findAll(query?: any): Promise<Book[]> {
    const filter: any = {};
    
    // Apply filters if provided
    if (query?.author) {
      filter.author = query.author;
    }
    
    if (query?.category) {
      filter.category = query.category;
    }
    
    if (query?.rating) {
      filter.rating = Number(query.rating);
    }
    
    // Search by title (partial match) if provided
    if (query?.title) {
      filter.title = { $regex: query.title, $options: 'i' }; // case-insensitive search
    }
    
    return await this.bookModel.find(filter).exec();
  }

  async findOne(id: string): Promise<Book | null> {
    const book = await this.bookModel.findById(id).exec();
    return book;
  }

  async findByUser(userId: string): Promise<Book[]> {
    const books = await this.bookModel.find({ user: userId }).exec();
    return books;
  }

  async update(id: string, updateBookDto: Partial<CreateBookDto>): Promise<Book | null> {
    const updatedBook = await this.bookModel.findByIdAndUpdate(id, updateBookDto, { new: true }).exec();
    return updatedBook;
  }

  async remove(id: string): Promise<Book | null> {
    const removedBook = await this.bookModel.findByIdAndDelete(id).exec();
    return removedBook;
  }
}