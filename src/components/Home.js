import React, { useEffect, useState } from 'react';
import '../styles/Home.css';
import { calculateMetrics, aggregatePnL } from './TradingResults';
import Papa from 'papaparse';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register necessary Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const Home = () => {
  const [mode, setMode] = useState('Equity'); // Mode state
  const [data, setData] = useState({ equity: [], daily: [], weekly: [], monthly: [] });
  const [metrics, setMetrics] = useState({});
  const [dates, setDates] = useState([]);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.2, // Процент видимой области секции
    };

    const callback = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // Прекращаем наблюдение после активации
        }
      });
    };

    const observer = new IntersectionObserver(callback, observerOptions);

    // Наблюдаем за всеми элементами с классом animate-section
    const sections = document.querySelectorAll('.animate-section');
    sections.forEach((section) => observer.observe(section));

    const fetchMetrics = async () => {
      try {
        const response = await fetch(`${process.env.PUBLIC_URL}/assets/files/results.csv`);
        const reader = response.body.getReader();
        const result = await reader.read();
        const decoder = new TextDecoder('utf-8');
        const csv = decoder.decode(result.value);

        Papa.parse(csv, {
          header: true,
          skipEmptyLines: true,
          complete: (parsedData) => {
            const returns = parsedData.data.map((row) => {
              if (row['Daily return'] && row['Daily return'].trim()) {
                return parseFloat(row['Daily return'].replace('%', '')) / 100;
              }
              return 0;
            });

            const datesFromCSV = parsedData.data.map((row) => row['Date'] || 'Unknown Date');
            const cumulativeReturns = returns.reduce((acc, curr) => {
              acc.push((acc[acc.length - 1] || 0) + curr);
              return acc;
            }, []);

            setData({
              equity: cumulativeReturns,
              daily: returns,
              weekly: aggregatePnL(returns, 5),
              monthly: aggregatePnL(returns, 20),
            });
            setMetrics(calculateMetrics(returns));
            setDates(datesFromCSV);
          },
        });
      } catch (error) {
        console.error('Error fetching or processing metrics:', error);
      }
    };

    fetchMetrics();
  }, []);

  const getChart = () => {
    const chartData = {
      labels: dates.slice(0, data[mode.toLowerCase()].length), // Adjust labels to match data length
      datasets: [
        {
        label: mode,
        data: data[mode.toLowerCase()],
        backgroundColor:
          mode === 'Equity'
            ? 'transparent' // No background color for the line chart
            : data[mode.toLowerCase()].map((value) => (value >= 0 ? '#336699' : '#cc5500')), // Dynamic bar colors
        borderColor: mode === 'Equity' ? '#336699 ' : undefined, // Line color for Equity
        borderWidth: mode === 'Equity' ? 2 : 0, // Line width for Equity, no borders for bars
        fill: mode === 'Equity',
        pointRadius: mode === 'Equity' ? 0 : 3, // Remove points for Equity
      },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
          },
          ticks: {
            callback: function (value, index) {
              return index % 10 === 0 ? this.getLabelForValue(value) : '';
            },
          },
          grid: {
            display: false,
          },
        },
        y: {
          title: {
            display: true,
            text: 'Cumulative Returns (%)',
          },
          ticks: {
            callback: (value) => `${(value * 100).toFixed(2)}%`, // Convert to percentage and round to 2 decimal places
          },
          grid: {
            display: false,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    };

    return mode === 'Daily' || mode === 'Weekly' || mode === 'Monthly' ? (
      <Bar data={chartData} options={options} />
    ) : (
      <Line data={chartData} options={options} />
    );
  };

  return (
    <div className="home">
      {/* Header Section */}
<header className="home-header">
  <h1>Welcome to Algo3 Portfolio</h1>
  <p>Your trusted partner in algorithmic trading.</p>
  <nav className="navigation">
    <ul>
      <li><a href="#about">About Us</a></li>
      <li><a href="#technology">Technology</a></li>
      <li><a href="#trading results">Trading Results</a></li>
      <li><a href="#goals and opportunity">Goals and Opportunity</a></li>
      <li><a href="#contact">Contact</a></li>
    </ul>
  </nav>
</header>


     {/* About Us Section */}
<section id="about" className="about-section">
  <h2>About Us</h2>
  <div className="about-cards">
    <div className="about-card">
      <h3>Our Expertise</h3>
      <p>
        A team of seasoned professionals with over 50 years of combined experience in global trading, programming, and quantitative research.
      </p>
      <ul>
        <li>Strategy development and data analysis</li>
        <li>Specialization in market microstructures</li>
        <li>Proven track record in implementing intraday strategies on CME Group Exchanges</li>
      </ul>
    </div>
    <div className="about-card">
      <h3>Leadership</h3>
      <p>
        Strong leadership with extensive experience in algorithmic trading and financial management.
      </p>
      <ul>
        <li>MBA in Finance with a focus on Derivative Management</li>
        <li>Proven ability to oversee operations and recruit top talent</li>
        <li>Fosters an accountability-driven culture</li>
      </ul>
    </div>
    <div className="about-card">
      <h3>Technical Skills</h3>
      <p>
        Cutting-edge technical skills to drive innovation in trading frameworks and tools.
      </p>
      <ul>
        <li>PhD in Physics and Mathematics</li>
        <li>Proficiency in C#, Python, MATLAB, and MySQL</li>
        <li>Development of proprietary trading frameworks and backtesting engines</li>
      </ul>
    </div>
  </div>
</section>


      {/* Technology Section */}
<section id="technology" className="technology animate-section">
  <div className="technology-banner">
    <h2>Technology</h2>
    <p>
      Our technology platform supports a portfolio of 60 fully systematic quantitative strategies implemented in-house using a C# environment. This includes a robust backtesting engine, execution module, data feeds, and a user-friendly GUI application.
    </p>
  </div>
  <div className="portfolio-composition-grid">
    <div className="composition-central">
    </div>
    <div className="composition-grid">
      <div className="grid-item">
        <h4>Number of Models</h4>
        <p>60</p>
      </div>
      <div className="grid-item">
        <h4>Strategy Types</h4>
        <p>Momentum, Mean Reversion, 1-leg/2-leg ARB</p>
      </div>
      <div className="grid-item">
        <h4>Latency</h4>
        <p>100 milliseconds (latency insensitive)</p>
      </div>
      <div className="grid-item">
        <h4>Frequency</h4>
        <p>MFT/LFT</p>
      </div>
      <div className="grid-item">
        <h4>Data Utilization</h4>
        <p>1-minute, 15-minute timeframes, and tick data</p>
      </div>
      <div className="grid-item">
        <h4>Portfolio Management</h4>
        <p>Strategies are managed dynamically with equal weight distribution</p>
      </div>
      <div className="grid-item">
        <h4>Backtesting</h4>
        <p>Data spanning 5 to 7 years ensures rigorous strategy validation</p>
      </div>
      <div className="grid-item">
        <h4>Sustainability</h4>
        <p>Each model sustains transaction costs of 1 tick plus 5 ticks of slippage per trade</p>
      </div>
    </div>
  </div>
</section>

{/* Section Divider */}
<div className="section-divider"></div>






     {/* Trading Results Section */}
<section id="trading-results" className="trading-results animate-section">
  <h2>Trading Results</h2>
  <div className="trading-results-container">
    <div className="metrics" style={{ textAlign: 'center', margin: '0 auto', maxWidth: '400px' }}>
      <ul style={{ listStyleType: 'none', padding: '0', margin: '0' }}>
        <li style={{ marginBottom: '10px' }}>
          <strong style={{ color: '#336699' }}>Gross PnL:</strong> {metrics.grossPnl}
        </li>
        <li style={{ marginBottom: '10px' }}>
          <strong style={{ color: '#336699' }}>Daily Mean PnL:</strong> {metrics.dailyMeanPnl}
        </li>
        <li style={{ marginBottom: '10px' }}>
          <strong style={{ color: '#336699' }}>Daily Std Dev:</strong> {metrics.dailyStdDev}
        </li>
        <li style={{ marginBottom: '10px' }}>
          <strong style={{ color: '#336699' }}>Sharpe Ratio:</strong> {metrics.sharpeRatio}
        </li>
        <li style={{ marginBottom: '10px' }}>
          <strong style={{ color: '#336699' }}>Max Run Up:</strong> {metrics.maxRunUp}
        </li>
        <li style={{ marginBottom: '10px' }}>
          <strong style={{ color: '#336699' }}>Max Drawdown:</strong> {metrics.maxDrawdown}
        </li>
      </ul>
    </div>
    <div className="equity-curve">
      <div
        style={{
          position: 'relative',
          height: '600px', // Reduced height for compactness
          width: '80%', // Maintain responsiveness
          margin: '20px auto',
        }}
      >
        {getChart()}
      </div>
    </div>
  </div>
  <div className="buttons" style={{ textAlign: 'center', marginTop: '10px' }}>
    {['Equity', 'Daily', 'Weekly', 'Monthly'].map((m) => (
      <button
        key={m}
        onClick={() => setMode(m)}
        style={{
          margin: '5px',
          padding: '8px 12px',
          backgroundColor: '#cc5500', // Orange color
          color: 'white', // White text for contrast
          border: 'none', // Remove border
          borderRadius: '5px', // Rounded corners
          cursor: 'pointer',
          fontSize: '0.9rem', // Smaller font for compact buttons
        }}
      >
        {m}
      </button>
    ))}
  </div>
</section>



      {/* Goals and Opportunity Section */}
<section id="goals and opportunity" section className="goals animate-section">
  <div className="goals-banner">
    <h2>Goals and Opportunity</h2>
    <p>
      We seek a capital investor aligned with our growth vision and risk management approach, aiming for a long-term partnership in algorithmic trading.
    </p>
  </div>

  <div className="value-proposition">
  <h3>Our Value Proposition</h3>
  <div className="value-proposition-blocks">
    <div className="value-block">
      <i className="fas fa-chart-line"></i>
      <h4>Proven Track Record</h4>
      <p>Consistent success in managing risk and generating returns.</p>
    </div>
    <div className="value-block">
      <i className="fas fa-handshake"></i>
      <h4>Partnerships with Leading Chicago-Based Proprietary Trading Firms</h4>
      <p>Strong ties to top firms, enhancing strategy and market access.</p>
    </div>
    <div className="value-block">
      <i className="fas fa-percent"></i>
      <h4>Exchange Membership with Lowest Commissions</h4>
      <p>Competitive rates that reduce trading costs.</p>
    </div>
    <div className="value-block">
      <i className="fas fa-gavel"></i>
      <h4>Robust Operational and Legal Structures</h4>
      <p>Well-established frameworks for smooth business operations.</p>
    </div>
  </div>
</div>


  <div className="section-divider">
  <span>Partnership</span>
</div>


  <div className="partnership-section">
  <div className="partnership-details">
    {/* Capital Partnership */}
    <div className="hover-card">
      <div className="card-header">
        <i className="fas fa-dollar-sign card-icon"></i>
        <h4>Capital Partnership</h4>
      </div>

      <ul>
        <li>Retail broker trading.</li>
        <li>Success fee policy.</li>
        <li>Profits are distributed quarterly.</li>
        <li>No operational costs.</li>
      </ul>
      <button className="cta-button">$100,000 Minimum Investment</button>
    </div>

    {/* Strategic Partnership */}
    <div className="hover-card">
      <div className="card-header">
        <i className="fas fa-handshake card-icon"></i>
        <h4>Strategic Partnership</h4>
      </div>

      <ul>
        <li>Corporate infrastructure for algorithmic trading.</li>
        <li>Stocks and option strategies.</li>
        <li>Lowest trading commissions.</li>
        <li>Operational and legal structures.</li>
      </ul>
      <button className="cta-button">$1 Million Minimum Investment</button>
    </div>
  </div>
</div>

{/* Section Divider */}
<div className="section-divider"></div>

</section>
{/* Contact and Feedback Section */}
<section id="contact" className="contact-section">
  <div className="contact-container">
    <h2>Want to Learn More?</h2>
    <p>
      We're excited to share more about our project and partnership opportunities. Feel free to reach out and let's start a conversation!
    </p>
    <form className="contact-form">
      <div className="form-group">
        <label htmlFor="name">Your Name</label>
        <input type="text" id="name" name="name" placeholder="Enter your name" required />
      </div>
      <div className="form-group">
        <label htmlFor="email">Your Email</label>
        <input type="email" id="email" name="email" placeholder="Enter your email" required />
      </div>
      <div className="form-group">
        <label htmlFor="message">Your Message</label>
        <textarea id="message" name="message" placeholder="Enter your message" rows="4" required></textarea>
      </div>
      <button type="submit" className="cta-button">Send Message</button>
    </form>
    <p className="contact-email">
      Or email us directly at <a href="mailto:invest@algo3.com">invest@algo3.com</a>
    </p>
  </div>
</section>


{/* Footer Section */}
<footer className="footer">
  <nav className="navigation">
    <ul>
      <li><a href="#about">About Us</a></li>
      <li><a href="#technology">Technology</a></li>
      <li><a href="#trading-results">Trading Results</a></li>
      <li><a href="#goals-and-opportunity">Goals and Opportunity</a></li>
      <li><a href="#contact">Contact</a></li>
    </ul>
  </nav>
  <div className="disclaimer">
    <p>
      <strong>Risk Disclosure:</strong> Past performance is not necessarily indicative of future results. Trading commodity futures, options, and forex involves substantial risk of loss and may not be suitable for all investors. Leverage can magnify losses as well as gains. Consider your financial condition and seek professional advice before investing.
    </p>
    <p>
      Prospective investors should carefully examine all information, including performance data, and rely on their own judgment in making investment decisions. There are no guarantees of profit, and all investments carry risks.
    </p>
  </div>
</footer>





    </div>
  );
};

export default Home;
