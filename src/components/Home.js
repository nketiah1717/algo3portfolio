import React, { useEffect, useState } from 'react';
import '../styles/Home.css';
import { calculateMetrics, aggregatePnL, aggregatePnLByMonth } from './TradingResults';
import Papa from 'papaparse';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register necessary Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const Home = () => {
const [mode, setMode] = useState('Equity'); // Default to 'Equity'
const [data, setData] = useState({ equity: [], daily: [], weekly: [], monthly: [], cashEquity: [] });
  const [metrics, setMetrics] = useState({});
  const [dates, setDates] = useState([]);
  const [lastUpdate, setLastUpdate] = useState('');

  const [showScroll, setShowScroll] = useState(false); // State for scroll-to-top button

  const chartHeight = `calc(200vh - 500px)`;

  const handleScroll = () => {
    if (window.scrollY > 300) {
      setShowScroll(true);
    } else {
      setShowScroll(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

   useEffect(() => {
  const handleResize = () => {
    console.log('Resize event triggered');
    // Update state or perform other actions, if necessary
  };

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);


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
    const [resultsResponse, cashResultsResponse] = await Promise.all([
      fetch(`${process.env.PUBLIC_URL}/assets/files/results.csv`),
      fetch(`${process.env.PUBLIC_URL}/assets/files/cashresults.csv`),
    ]);

    const [resultsText, cashResultsText] = await Promise.all([
      resultsResponse.text(),
      cashResultsResponse.text(),
    ]);

    const parseCSV = (csvText) =>
      new Promise((resolve) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (parsedData) => resolve(parsedData.data),
        });
      });

    const [resultsData, cashResultsData] = await Promise.all([
      parseCSV(resultsText),
      parseCSV(cashResultsText),
    ]);

    const processReturns = (data, isCash = false) => {
  const returns = data.map((row) =>
    row['Daily return'] ? parseFloat(row['Daily return']) / 100 : 0
  );
  const cumulativeReturns = returns.reduce((acc, curr) => {
    acc.push((acc[acc.length - 1] || 0) + curr);
    return acc;
  }, []);
  return isCash
    ? { returns, cumulativeReturns: cumulativeReturns.map((val) => val * 100) } // Adjust scaling
    : { returns, cumulativeReturns };
};


    const { returns: equityReturns, cumulativeReturns: equityCumulative } =
      processReturns(resultsData);
    const { returns: cashReturns, cumulativeReturns: cashCumulative } =
      processReturns(cashResultsData, true);

    const validDates = resultsData.map((row) => row['Date']).filter((date) => !isNaN(new Date(date).getTime()));

      setData({
        equity: equityCumulative,
        daily: equityReturns,
        weekly: aggregatePnL(equityReturns, 5),
        monthly: aggregatePnLByMonth(equityReturns, validDates).monthlyPnL,
        cashEquity: cashCumulative,
      });

      setDates({
        equity: validDates,
        daily: validDates,
        weekly: validDates.filter((_, index) => index % 5 === 0),
        monthly: aggregatePnLByMonth(equityReturns, validDates).monthlyLabels,
        'equity cash': validDates,
      });

      setMetrics(calculateMetrics(equityReturns));

      // Store the last date
      const lastUpdate = validDates[validDates.length - 1];
      setLastUpdate(lastUpdate);
    } catch (error) {
      console.error('Error fetching or processing metrics:', error);
    }
  };


  fetchMetrics();
}, []);

    // Update chart on resize
    useEffect(() => {
        const handleResize = () => {
            window.dispatchEvent(new Event('resize'));
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

 const getChart = () => {
  const keyMapping = {
    'equity cash': 'cashEquity',
    equity: 'equity',
    daily: 'daily',
    weekly: 'weekly',
    monthly: 'monthly',
  };

  const key = keyMapping[mode.toLowerCase()];
  if (!data[key] || !dates[mode.toLowerCase()]) {
    console.error(`No data found for mode: ${mode}`);
    return null;
  }

  const chartData = {
    labels: dates[mode.toLowerCase()], // Use specific labels for the mode
    datasets: [
      {
        label: mode,
        data: data[key],
        backgroundColor: mode === 'Daily' || mode === 'Weekly' || mode === 'Monthly'
          ? data[key].map((value) => (value >= 0 ? '#336699' : '#cc5500')) // Fill color for bars
          : 'transparent', // Transparent for lines
        borderColor: mode === 'Equity Cash' ? '#cc5500' : '#336699', // Line color
        borderWidth: mode === 'Daily' || mode === 'Weekly' || mode === 'Monthly' ? 0 : 2, // Remove borders for bars
        pointRadius: 0, // No points on lines
        tension: mode === 'Equity' || mode === 'Equity Cash' ? 0.4 : 0, // Smooth line for equity
      },
    ],
  };

  const options = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      ticks: {
        maxTicksLimit: window.innerWidth < 768 ? 3 : 10,
        padding: 15,
      },
      grid: { display: false },
    },
    y: {
      ticks: {
        callback: (value) =>
          mode === 'Equity Cash'
            ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 0 })}`
            : `${(value * 100).toFixed(2)}%`,
      },
      grid: { display: false },
    },
  },
  plugins: {
    legend: { display: false },
    customLabel: {
      position: { x: 10, y: 10 },
      text: `Last update: ${lastUpdate}`,
    },
  },
};

const customLabelPlugin = {
  id: 'customLabel',
  beforeDraw: (chart, args, options) => {
    const { ctx, chartArea } = chart;
    const text = options.text;

    // Adjust size for mobile screens
    const isMobile = window.innerWidth < 768;
    const fontSize = isMobile ? 10 : 14; // Smaller font size for mobile
    const padding = isMobile ? 5 : 10; // Smaller padding for mobile
    const x = chartArea.left + padding; // Adjust position based on padding
    const y = chartArea.top + padding + fontSize;

    // Set font and measure text
    ctx.save();
    ctx.font = `${fontSize}px Arial`;
    const textWidth = ctx.measureText(text).width;

    // Draw background box
    ctx.fillStyle = '#f0f0f0'; // Light gray background
    ctx.strokeStyle = '#336699'; // Blue border
    ctx.lineWidth = 1;

    // Rectangle dimensions
    const boxWidth = textWidth + padding * 2;
    const boxHeight = fontSize + padding * 2;

    ctx.fillRect(x, y - boxHeight, boxWidth, boxHeight); // Draw filled rectangle
    ctx.strokeRect(x, y - boxHeight, boxWidth, boxHeight); // Draw border

    // Draw text
    ctx.fillStyle = '#000'; // Black text
    ctx.fillText(text, x + padding, y - padding); // Draw text inside the box

    ctx.restore();
  },
};






  const chartContainerStyle = {
  position: 'relative',
  height: window.innerWidth < 768 ? '300px' : 'calc(100vh - 150px)', // Adjust for mobile
  width: '100%',
  maxWidth: '95vw', // Prevent horizontal overflow
  margin: '10px auto', // Center the chart
};



  return (
  <div style={chartContainerStyle}>
    {mode === 'Daily' || mode === 'Weekly' || mode === 'Monthly' ? (
      <Bar
        data={chartData}
        options={options}
        plugins={[customLabelPlugin]} // Include custom label plugin
      />
    ) : (
      <Line
        data={chartData}
        options={options}
        plugins={[customLabelPlugin]} // Include custom label plugin
      />
    )}
  </div>
);

};



  return (
    <div className="home">
      <header className="home-header">
  <div className="header-content">
    {/* Основной текст */}
    <h1 className="header-title">Algopath Portfolio</h1>
    <p className="header-subtitle">Your trusted partner in algorithmic trading.</p>

    {/* Навигация */}
    <nav className="header-nav">
      <ul className="nav-list">
        <li><a href="#about">About Us</a></li>
<li><a href="#project timeline">Project Timeline</a></li>
<li><a href="#technology">Technology</a></li>
<li><a href="#trading-results">Trading Results</a></li>
<li><a href="#goals-and-opportunity">Goals and Opportunity</a></li>
<li><a href="#contact">Contact</a></li>

      </ul>
    </nav>
  </div>
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
{/* Project Timeline Section */}
<section id="project timeline" section className="timeline">
  <h2>Project Timeline</h2>
  <div className="timeline-container">
    {/* Timeline items */}
    <div className="timeline-item animate-section">
      <div className="timeline-date">March 2023</div>
      <div className="timeline-content">
        <h3>Project Launch</h3>
        <p>The project officially began with a vision to create a cost-effective and scalable quantitative portfolio.</p>
      </div>
    </div>
    <div className="timeline-item animate-section">
      <div className="timeline-date">July 2023</div>
      <div className="timeline-content">
        <h3>Market Entry</h3>
        <p>Successfully entered the market with an initial capital of $150,000.</p>
      </div>
    </div>
    <div className="timeline-item animate-section">
      <div className="timeline-date">August 2024</div>
      <div className="timeline-content">
        <h3>New Capital Partner</h3>
        <p>Achieved a major milestone by onboarding a strategic capital partner, securing CME membership, and reducing operational costs by threefold.</p>
      </div>
    </div>
    <div className="timeline-item animate-section now-highlight">
  <div className="timeline-date">Now</div>
  <div className="timeline-content">
    <h3>Expansion</h3>
    <p>Seeking additional capital to expand the portfolio and explore new markets.</p>
  </div>
</div>

  </div>
</section>



      {/* Technology Section */}
<section id="technology" className="technology animate-section">
  <div className="banner-style">
    <h2>Technology</h2>
    <p>
      Our technology platform supports a portfolio of 60 fully systematic quantitative strategies implemented in-house using a C# environment. This includes a robust backtesting engine, execution module, data feeds, and a user-friendly GUI application.
    </p>
  </div>
  <div class="portfolio-composition-grid">
  <div class="composition-grid">
    <div class="grid-item">
      <h4>Number of Models</h4>
      <p>60</p>
    </div>
    <div class="grid-item">
      <h4>Strategy Types</h4>
      <p>Momentum, Mean Reversion, 1-leg/2-leg ARB</p>
    </div>
    <div class="grid-item">
      <h4>Latency</h4>
      <p>100 milliseconds (latency insensitive)</p>
    </div>
    <div class="grid-item">
      <h4>Frequency</h4>
      <p>MFT/LFT</p>
    </div>
    <div class="grid-item">
      <h4>Data Utilization</h4>
      <p>1-minute, 15-minute timeframes, and tick data</p>
    </div>
    <div class="grid-item">
      <h4>Portfolio Management</h4>
      <p>Strategies are managed dynamically with equal weight distribution</p>
    </div>
    <div class="grid-item">
      <h4>Backtesting</h4>
      <p>Data spanning 5 to 7 years ensures rigorous strategy validation</p>
    </div>
    <div class="grid-item">
      <h4>Sustainability</h4>
      <p>Each model sustains transaction costs of 1 tick plus 5 ticks of slippage per trade</p>
    </div>
  </div>
</div>

</section>







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
    height: 'calc(100vh - 150px)', // Высота графика = высота окна - фиксированный отступ
    width: '100%',
    margin: '20px auto',
  }}
>
  {getChart()}
</div>


</div>

  </div>
  <div className="buttons" style={{ textAlign: 'center', marginTop: '10px' }}>
    {['Equity','Equity Cash', 'Daily', 'Weekly', 'Monthly'].map((m) => (
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
<section id="goals-and-opportunity" className="goals animate-section">
  <div className="banner-style">
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


  {/* Partnership Section */}
  <section id="contact" className="partnership-section">
    <div className="partnership-container">
      <h2 className="partnership-title">Join AlgoPath Portfolio</h2>
      <p className="partnership-description">
        We are seeking a strategic partnership with either an individual investor or a larger hedge fund to operate and manage our AlgoPath Portfolio – a highly refined algorithmic trading system designed to generate consistent returns with minimized risk.
      </p>

      <div className="partnership-details">
        <div className="partnership-card">
          <h3>Capital Requirement</h3>
          <p>
            <strong>$5–$10 million</strong> with a minimum of <strong>$1 million</strong> allocated to cover potential losses during the first year.
          </p>
        </div>
        <div className="partnership-card">
          <h3>Why Partner with Us?</h3>
          <ul>
            <li>Proven algorithmic trading expertise with consistent performance.</li>
            <li>Access to proprietary trading strategies and technology.</li>
            <li>Exclusive right of first refusal to capitalize future portfolios.</li>
          </ul>
        </div>
        <div className="partnership-card">
          <h3>Ready to Partner?</h3>
          <p>Join us to redefine the future of algorithmic trading.</p>
          <button className="cta-button">info@algopathportfolio.com</button>
        </div>
      </div>
    </div>
  </section>
</section>


{/* Footer Section */}
<footer className="site-footer">
  <div className="footer-container">
    {/* Ссылки */}
    <div className="footer-links">
      <h3>Quick Links</h3>
      <ul>
                <li><a href="#about">About Us</a></li>
<li><a href="#project timeline">Project Timeline</a></li>
<li><a href="#technology">Technology</a></li>
<li><a href="#trading-results">Trading Results</a></li>
<li><a href="#goals-and-opportunity">Goals and Opportunity</a></li>
<li><a href="#contact">Contact</a></li>

      </ul>
    </div>

    {/* Контакты */}
    <div className="footer-contact">
      <h3>Contact Us</h3>
      <p>Email: info@algopathportfolio.com</p>
      <p>Phone: +1-312-543-7471</p>
      <p>Location: 817 Hibbard Road Unit E Wilmette, IL 60091 USA</p>
    </div>

    {/* Дисклеймер */}
    <div className="footer-disclaimer">
      <p>
        Disclaimer: Past performance is not necessarily indicative of future results. Trading commodity futures, options, and forex involves substantial risk of loss and may not be suitable for all investors. Leverage can magnify losses as well as gains. Consider your financial condition and seek professional advice before investing.
      </p>
    </div>
  </div>

  {/* Авторское право */}
  <div className="footer-copyright">
    <p>&copy; 2024 AlgoPath Portfolio. All Rights Reserved.</p>
  </div>
</footer>
{/* Кнопка "Наверх" */}
      {showScroll && (
        <button className="scroll-to-top" onClick={scrollToTop}>
          ↑
        </button>
      )}





    </div>
  );
};

export default Home;
