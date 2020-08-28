import { getCustomRepository, getRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface CreateTransactionDTO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: CreateTransactionDTO): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const balance = await transactionsRepository.getBalance();

    if (type !== 'income' && type !== 'outcome') {
      throw new AppError('This is not an accepted transaction type');
    }

    if (type === 'outcome') {
      if (value > balance.total) {
        throw new AppError("You don't have enough balance");
      }
    }

    const categoriesRepository = getRepository(Category);
    let category_id = '';

    const existCategory = await categoriesRepository.findOne({
      where: { title: category },
    });

    if (existCategory) {
      category_id = existCategory.id;
    } else {
      const createCategory = categoriesRepository.create({
        title: category,
      });

      await categoriesRepository.save(createCategory);

      category_id = createCategory.id;
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
