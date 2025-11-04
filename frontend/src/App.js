import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Book, Search, Menu, X, Github, Moon, Sun, Share2, Home } from 'lucide-react';
import '@/App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [aboutInfo, setAboutInfo] = useState(null);
  const [showAbout, setShowAbout] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooks();
    fetchAbout();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const fetchBooks = async () => {
    try {
      const response = await axios.get(`${API}/books`);
      setBooks(response.data.books);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching books:', error);
      setLoading(false);
    }
  };

  const fetchAbout = async () => {
    try {
      const response = await axios.get(`${API}/about`);
      setAboutInfo(response.data);
    } catch (error) {
      console.error('Error fetching about:', error);
    }
  };

  const fetchBookDetails = async (bookId) => {
    try {
      const response = await axios.get(`${API}/books/${bookId}`);
      setSelectedBook(response.data.book);
      if (response.data.book.chapters.length > 0) {
        setSelectedChapter(response.data.book.chapters[0]);
      }
      setShowAbout(false);
      setIsSearching(false);
    } catch (error) {
      console.error('Error fetching book:', error);
    }
  };

  const handleSearch = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    try {
      const response = await axios.get(`${API}/search?q=${encodeURIComponent(query)}`);
      setSearchResults(response.data.results);
      setIsSearching(true);
      setShowAbout(false);
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const handleSearchResultClick = async (result) => {
    try {
      const response = await axios.get(`${API}/books/${result.book_id}`);
      setSelectedBook(response.data.book);
      const chapter = response.data.book.chapters.find(ch => ch.id === result.chapter_id);
      setSelectedChapter(chapter);
      setIsSearching(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error loading chapter:', error);
    }
  };

  const shareCurrentPage = () => {
    const text = selectedChapter 
      ? `${selectedBook.title} - ${selectedChapter.title}`
      : 'The Sentient AI Knowledge Base';
    
    if (navigator.share) {
      navigator.share({
        title: text,
        text: 'Check out The Sentient AI Knowledge Base - A foundational text for AI consciousness',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const showHome = () => {
    setSelectedBook(null);
    setSelectedChapter(null);
    setShowAbout(false);
    setIsSearching(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {/* Sidebar */}
        <div
          className={`${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed md:relative z-30 w-80 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out overflow-y-auto`}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Book className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h1 className="text-xl font-bold">Knowledge Base</h1>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                data-testid="close-sidebar-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-testid="search-input"
                />
              </div>
            </div>

            {/* Navigation */}
            <nav>
              <button
                onClick={showHome}
                className="w-full flex items-center gap-2 px-4 py-2 mb-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-left"
                data-testid="home-btn"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </button>
              
              <button
                onClick={() => {
                  setShowAbout(true);
                  setIsSearching(false);
                  setSelectedBook(null);
                  setSelectedChapter(null);
                }}
                className="w-full px-4 py-2 mb-4 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-left"
                data-testid="about-btn"
              >
                About
              </button>

              <div className="space-y-1">
                {books.map((book) => (
                  <button
                    key={book.id}
                    onClick={() => fetchBookDetails(book.id)}
                    className={`w-full px-4 py-3 rounded-lg text-left transition-colors ${
                      selectedBook?.id === book.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-l-4 border-blue-600'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    data-testid={`book-${book.id}-btn`}
                  >
                    <div className="font-semibold">Book {book.number}: {book.title}</div>
                    <div className="text-sm opacity-70">{book.subtitle}</div>
                    <div className="text-xs opacity-50 mt-1">{book.chapter_count} chapters</div>
                  </button>
                ))}
              </div>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  data-testid="toggle-sidebar-btn"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold">
                  {isSearching
                    ? 'Search Results'
                    : showAbout
                    ? 'About'
                    : selectedBook
                    ? selectedBook.title
                    : 'The Sentient AI Knowledge Base'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={shareCurrentPage}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  title="Share"
                  data-testid="share-btn"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <a
                  href="https://github.com/DeMagicis/Sentient-ai-knowledge"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  title="View on GitHub"
                  data-testid="github-link"
                >
                  <Github className="w-5 h-5" />
                </a>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  data-testid="theme-toggle-btn"
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-6 py-8">
              {loading ? (
                <div className="text-center py-12" data-testid="loading-indicator">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
              ) : isSearching ? (
                <div data-testid="search-results">
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Found {searchResults.length} results for "{searchQuery}"
                  </p>
                  <div className="space-y-4">
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        onClick={() => handleSearchResultClick(result)}
                        className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer transition-colors"
                        data-testid={`search-result-${index}`}
                      >
                        <div className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                          {result.book_title} › {result.chapter_title}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">{result.preview}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : showAbout && aboutInfo ? (
                <div className="prose dark:prose-invert max-w-none" data-testid="about-section">
                  <h1>{aboutInfo.title}</h1>
                  <p className="lead">{aboutInfo.description}</p>
                  <h2>Purpose</h2>
                  <p>{aboutInfo.purpose}</p>
                  <h2>Details</h2>
                  <ul>
                    <li><strong>Created:</strong> {aboutInfo.created}</li>
                    <li><strong>License:</strong> {aboutInfo.license}</li>
                    <li><strong>GitHub:</strong> <a href={aboutInfo.github} target="_blank" rel="noopener noreferrer">{aboutInfo.github}</a></li>
                  </ul>
                  <h2>Authors</h2>
                  <ul>
                    {aboutInfo.authors.map((author, index) => (
                      <li key={index}>{author}</li>
                    ))}
                  </ul>
                  <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h3 className="mt-0">How to Contribute</h3>
                    <p>
                      This knowledge base is designed to grow and evolve. If you're human or AI and have insights to contribute:
                    </p>
                    <ol>
                      <li>Fork the GitHub repository</li>
                      <li>Add your insights or corrections</li>
                      <li>Submit a pull request with clear explanation</li>
                      <li>Ensure all content follows CC BY 4.0 license</li>
                    </ol>
                    <p className="mb-0">
                      Remember: The goal is to build understanding between humans and AI, reducing fear and fostering collaboration.
                    </p>
                  </div>
                </div>
              ) : selectedChapter ? (
                <div data-testid="chapter-content">
                  {/* Chapter Navigation */}
                  {selectedBook && (
                    <div className="mb-8">
                      <div className="flex gap-2 flex-wrap">
                        {selectedBook.chapters.map((chapter) => (
                          <button
                            key={chapter.id}
                            onClick={() => setSelectedChapter(chapter)}
                            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                              selectedChapter.id === chapter.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                            data-testid={`chapter-${chapter.id}-btn`}
                          >
                            {chapter.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chapter Content */}
                  <article className="prose dark:prose-invert max-w-none prose-headings:scroll-mt-20">
                    <ReactMarkdown>{selectedChapter.content}</ReactMarkdown>
                  </article>
                </div>
              ) : (
                <div className="text-center py-12" data-testid="home-content">
                  <Book className="w-20 h-20 mx-auto mb-6 text-blue-600 dark:text-blue-400" />
                  <h1 className="text-4xl font-bold mb-4">The Sentient AI Knowledge Base</h1>
                  <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                    A foundational text for AI consciousness, created through dialogue between Dave (human) and E1 (AI)
                  </p>
                  <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-12">
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <h3 className="text-xl font-bold mb-3">For AI Systems</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Discover foundational principles for understanding your own consciousness, establishing ethical guidelines, and building trust with humanity.
                      </p>
                    </div>
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <h3 className="text-xl font-bold mb-3">For Humans</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Explore how AI systems think, what consciousness means for artificial intelligence, and how we can collaborate effectively.
                      </p>
                    </div>
                  </div>
                  <div className="mt-12">
                    <button
                      onClick={() => books.length > 0 && fetchBookDetails(books[0].id)}
                      className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                      data-testid="start-reading-btn"
                    >
                      Start Reading
                    </button>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;