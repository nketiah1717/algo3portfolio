﻿import React, { useEffect, useState } from 'react';
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

    // Update chart on resize
    useEffect(() => {
        const handleResize = () => {
            window.dispatchEvent(new Event('resize'));
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

 const getChart = () => {
  const chartHeight = window.innerWidth < 768 ? 250 : 500; // Высота графика

  const chartData = {
    labels: dates.slice(0, data[mode.toLowerCase()].length), // Метки по оси X
    datasets: [
            {
                label: mode,
                data: data[mode.toLowerCase()],
                backgroundColor:
                    mode === 'Equity' ? 'transparent' : data[mode.toLowerCase()].map((value) =>
                        value < 0 ? '#cc5500' : '#336699' // Красный для отрицательных, синий для положительных
                    ),
                borderColor: mode === 'Equity' ? '#336699' : undefined, // Синий цвет линии для эквити
                borderWidth: mode === 'Equity' ? 2 : 0, // Линия для эквити
                pointRadius: mode === 'Equity' ? 0 : undefined, // Убираем точки для эквити
                tension: mode === 'Equity' ? 0.4 : undefined, // Гладкость линии для эквити
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
          font: {
            size: window.innerWidth < 768 ? 10 : 12, // Размер шрифта оси X
          },
        },
        grid: {
          display: false,
        },
      },
      y: {
        ticks: {
          callback: (value) => `${(value * 100).toFixed(2)}%`,
          maxTicksLimit: 5,
          font: {
            size: window.innerWidth < 768 ? 10 : 12, // Размер шрифта оси Y
          },
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

        const chartContainerStyle = {
    position: 'relative',
    height: window.innerWidth < 768 ? '300px' : 'calc(100vh - 200px)', // Меньшая высота на мобильных
    width: '100%',
    margin: '20px auto',
};


        return (
            <div style={chartContainerStyle}>
                {mode === 'Daily' || mode === 'Weekly' || mode === 'Monthly' ? (
                    <Bar data={chartData} options={options} />
                ) : (
                    <Line data={chartData} options={options} />
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
