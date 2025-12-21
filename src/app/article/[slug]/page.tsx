"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import snobolLogo from "../../lumepall.png";

interface ArticleData {
    id: string;
    title: string;
    description?: string;
    slug: string;
    content?: string;
    thumbnail_url?: string;
    image_url?: string;
    published_at: string;
}

// Calculate reading time from content
function calculateReadingTime(content: string): number {
    const text = content.replace(/<[^>]*>/g, ''); // Strip HTML
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    return Math.max(1, Math.ceil(wordCount / 200)); // ~200 words per minute
}

// Format date
function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
}

export default function ArticlePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const [article, setArticle] = useState<ArticleData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const resolvedParams = await params;
                const response = await fetch(`/api/article/${resolvedParams.slug}`);
                const data = await response.json();

                if (!response.ok) {
                    setError(data.error || 'Failed to load article');
                    return;
                }

                setArticle(data.article);
            } catch (err) {
                console.error('Failed to fetch article:', err);
                setError('Failed to load article');
            } finally {
                setLoading(false);
            }
        };

        fetchArticle();
    }, [params]);

    if (loading) {
        return (
            <div className="bg-white min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-gray-400" style={{ fontFamily: 'Avenir Light', fontWeight: 300 }}>
                    Loading...
                </div>
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className="bg-white min-h-screen flex flex-col items-center justify-center px-4">
                <h1 className="text-2xl text-gray-800 mb-4" style={{ fontFamily: 'Avenir Light', fontWeight: 300 }}>
                    Article not found
                </h1>
                <Link
                    href="/"
                    className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
                    style={{ fontFamily: 'Avenir Light', fontWeight: 300 }}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to home
                </Link>
            </div>
        );
    }

    const readingTime = article.content ? calculateReadingTime(article.content) : 3;

    return (
        <div className="bg-white min-h-screen" style={{ fontFamily: 'Avenir Light', fontWeight: 300 }}>
            {/* Header */}
            <header className="w-full px-4 md:px-12 lg:px-24 py-8">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                    </Link>
                    <Link href="/" className="opacity-85">
                        <Image
                            src={snobolLogo}
                            alt="Lumepall"
                            width={80}
                            height={32}
                            className="h-6 md:h-8 w-auto"
                            priority
                        />
                    </Link>
                </div>
            </header>

            {/* Article Content */}
            <main className="px-4 md:px-12 lg:px-24 pb-16">
                <article className="max-w-3xl mx-auto">
                    {/* Article Header */}
                    <header className="mb-10">
                        <h1
                            className="text-3xl md:text-4xl lg:text-5xl text-black mb-6 leading-tight"
                            style={{ fontFamily: 'Avenir Light', fontWeight: 300 }}
                        >
                            {article.title}
                        </h1>

                        {article.description && (
                            <p
                                className="text-lg md:text-xl text-gray-600 mb-6"
                                style={{ fontFamily: 'Avenir Light', fontWeight: 300 }}
                            >
                                {article.description}
                            </p>
                        )}

                        <div className="flex items-center gap-6 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(article.published_at)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>{readingTime} min read</span>
                            </div>
                        </div>
                    </header>

                    {/* Featured Image */}
                    {article.image_url && (
                        <div className="mb-10 rounded-lg overflow-hidden bg-gray-100">
                            <div className="aspect-video relative">
                                <img
                                    src={article.image_url}
                                    alt={article.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    )}

                    {/* Article Body */}
                    <div
                        className="article-content prose prose-lg max-w-none"
                        style={{ fontFamily: 'Avenir Light', fontWeight: 300 }}
                        dangerouslySetInnerHTML={{ __html: article.content || '' }}
                    />
                </article>
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-100 px-4 md:px-12 lg:px-24 py-8">
                <div className="max-w-4xl mx-auto text-center">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Lumepall</span>
                    </Link>
                </div>
            </footer>

            {/* Article Content Styles */}
            <style jsx global>{`
        .article-content h2 {
          font-family: 'Avenir Light', 'Avenir', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-weight: 300;
          font-size: 1.75rem;
          color: #000;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
          line-height: 1.3;
        }
        
        .article-content h3 {
          font-family: 'Avenir Light', 'Avenir', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-weight: 400;
          font-size: 1.35rem;
          color: #000;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          line-height: 1.4;
        }
        
        .article-content p {
          font-family: 'Avenir Light', 'Avenir', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-weight: 300;
          font-size: 1.125rem;
          color: #333;
          line-height: 1.8;
          margin-bottom: 1.25rem;
        }
        
        .article-content ul,
        .article-content ol {
          font-family: 'Avenir Light', 'Avenir', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-weight: 300;
          font-size: 1.125rem;
          color: #333;
          line-height: 1.8;
          margin-bottom: 1.25rem;
          padding-left: 1.5rem;
        }
        
        .article-content li {
          margin-bottom: 0.5rem;
        }
        
        .article-content strong {
          font-weight: 500;
          color: #000;
        }
        
        .article-content blockquote {
          border-left: 3px solid #d1d5db;
          padding-left: 1.5rem;
          margin: 2rem 0;
          font-style: italic;
          color: #666;
        }
        
        .article-content a {
          color: #000;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        
        .article-content a:hover {
          color: #333;
        }
      `}</style>
        </div>
    );
}
