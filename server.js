const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const app = express();

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://abhijitdeshmukh501:abhi@cluster0.pnsz7au.mongodb.net/scrubberDB?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// Define Mongoose Schema
const SalesSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now, index: true },
  sheetsSold: { type: Number, required: true, min: 1 },
  totalRevenue: { type: Number, required: true },
  pricePerSheet: { type: Number }
}, { timestamps: true });

const ExpenseSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now, index: true },
  type: { type: String, enum: ['petrol', 'other'], required: true },
  amount: { type: Number, required: true },
  description: { type: String }
}, { timestamps: true });

const Sale = mongoose.model('Sale', SalesSchema);
const Expense = mongoose.model('Expense', ExpenseSchema);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Helper function to calculate date ranges
function getDateRange(period) {
  const now = new Date();
  const range = { start: new Date(0), end: new Date() }; // Default to all time

  switch (period) {
    case 'today':
      range.start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      range.end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    case 'week':
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Set to Sunday of the current week
      range.start = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate(), 0, 0, 0, 0);
      range.end = new Date(); // Up to current moment
      break;
    case 'month':
      range.start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      range.end = new Date(); // Up to current moment
      break;
    case 'year':
      range.start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      range.end = new Date(); // Up to current moment
      break;
    case 'all':
      range.start = new Date(0); // Epoch (beginning of time)
      range.end = new Date(); // Current moment
      break;
  }
  return range;
}

// Routes
app.post('/api/sales', async (req, res) => {
  try {
    const { date, sheetsSold, totalRevenue } = req.body;
    
    if (!sheetsSold || !totalRevenue) {
      return res.status(400).json({ 
        success: false, 
        message: 'Sheets sold and total revenue are required' 
      });
    }

    const pricePerSheet = totalRevenue / sheetsSold;
    
    const newSale = new Sale({
      date: date || new Date(),
      sheetsSold,
      totalRevenue,
      pricePerSheet
    });

    await newSale.save();
    res.status(201).json({ 
      success: true, 
      message: 'Sale recorded successfully',
      data: newSale
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: 'Error saving sale data', 
      error: err.message 
    });
  }
});

app.put('/api/sales/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, sheetsSold, totalRevenue } = req.body;
    
    if (!sheetsSold || !totalRevenue) {
      return res.status(400).json({ 
        success: false, 
        message: 'Sheets sold and total revenue are required' 
      });
    }

    const pricePerSheet = totalRevenue / sheetsSold;
    
    const updatedSale = await Sale.findByIdAndUpdate(id, {
      date,
      sheetsSold,
      totalRevenue,
      pricePerSheet
    }, { new: true });

    if (!updatedSale) {
      return res.status(404).json({ 
        success: false, 
        message: 'Sale not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Sale updated successfully',
      data: updatedSale
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating sale', 
      error: err.message 
    });
  }
});

app.delete('/api/sales/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSale = await Sale.findByIdAndDelete(id);

    if (!deletedSale) {
      return res.status(404).json({ 
        success: false, 
        message: 'Sale not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Sale deleted successfully',
      data: deletedSale
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting sale', 
      error: err.message 
    });
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const { date, type, amount, description } = req.body;
    
    if (!type || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Type and amount are required' 
      });
    }

    const newExpense = new Expense({
      date: date || new Date(),
      type,
      amount,
      description: description || `${type} expense`
    });

    await newExpense.save();
    res.status(201).json({ 
      success: true, 
      message: 'Expense recorded successfully',
      data: newExpense
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: 'Error saving expense data', 
      error: err.message 
    });
  }
});

app.put('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, type, amount, description } = req.body;
    
    if (!type || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Type and amount are required' 
      });
    }

    const updatedExpense = await Expense.findByIdAndUpdate(id, {
      date,
      type,
      amount,
      description
    }, { new: true });

    if (!updatedExpense) {
      return res.status(404).json({ 
        success: false, 
        message: 'Expense not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Expense updated successfully',
      data: updatedExpense
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating expense', 
      error: err.message 
    });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedExpense = await Expense.findByIdAndDelete(id);

    if (!deletedExpense) {
      return res.status(404).json({ 
        success: false, 
        message: 'Expense not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Expense deleted successfully',
      data: deletedExpense
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting expense', 
      error: err.message 
    });
  }
});

app.get('/api/transactions', async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    let query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (type === 'sales') {
      const sales = await Sale.find(query).sort({ date: -1 });
      return res.json({ success: true, data: { sales } });
    } else if (type === 'expenses') {
      const expenses = await Expense.find(query).sort({ date: -1 });
      return res.json({ success: true, data: { expenses } });
    } else {
      const sales = await Sale.find(query).sort({ date: -1 });
      const expenses = await Expense.find(query).sort({ date: -1 });
      return res.json({ success: true, data: { sales, expenses } });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching transactions', 
      error: err.message 
    });
  }
});

app.get('/api/summary', async (req, res) => {
  try {
    const { period } = req.query;
    const { start, end } = getDateRange(period);
    
    const dateFilter = { 
      date: { $gte: start, $lte: end } 
    };

    // Get sales summary
    const salesSummary = await Sale.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalSheets: { $sum: "$sheetsSold" },
          totalRevenue: { $sum: "$totalRevenue" },
          totalProductionCost: { $sum: { $multiply: ["$sheetsSold", 43] } },
          avgPricePerSheet: { $avg: "$pricePerSheet" }
        }
      }
    ]);

    // Get all expenses (petrol and other) for the selected period
    const allExpenses = await Expense.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 } // Count of expenses
        }
      }
    ]);

    // Get petrol expenses specifically
    const petrolExpenses = await Expense.aggregate([
      { 
        $match: { 
          ...dateFilter,
          type: 'petrol' 
        } 
      },
      {
        $group: {
          _id: null,
          totalPetrol: { $sum: "$amount" }
        }
      }
    ]);

    // Get other expenses specifically
    const otherExpenses = await Expense.aggregate([
      { 
        $match: { 
          ...dateFilter,
          type: 'other' 
        } 
      },
      {
        $group: {
          _id: null,
          totalOtherExpenses: { $sum: "$amount" }
        }
      }
    ]);

    // Prepare response
    const response = {
      totalSheets: salesSummary[0]?.totalSheets || 0,
      totalRevenue: salesSummary[0]?.totalRevenue || 0,
      totalProductionCost: salesSummary[0]?.totalProductionCost || 0,
      totalPetrol: petrolExpenses[0]?.totalPetrol || 0,
      totalOtherExpenses: otherExpenses[0]?.totalOtherExpenses || 0,
      totalExpenses: allExpenses[0]?.totalAmount || 0, // Total of all expenses
      expenseCount: allExpenses[0]?.count || 0, // Count of all expenses
      avgPricePerSheet: salesSummary[0]?.avgPricePerSheet ? 
        parseFloat(salesSummary[0].avgPricePerSheet.toFixed(2)) : 0,
    };

    // Calculate profit metrics using the combined total expenses
    response.netProfit = response.totalRevenue - response.totalProductionCost - response.totalExpenses;
    response.profitMargin = response.totalRevenue > 0 ? 
      ((response.netProfit / response.totalRevenue) * 100).toFixed(2) : 0;

    res.json({ success: true, data: response });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: 'Error generating summary', 
      error: err.message 
    });
  }
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something broke!', 
    error: err.message 
  });
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
