import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollFadeIn } from "@/components/ScrollFadeIn";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Scan, 
  Database, 
  Zap, 
  Target, 
  Shield, 
  QrCode, 
  FileSpreadsheet, 
  FileText, 
  Download,
  ArrowRight,
  Sparkles,
  Gauge,
  Eye
} from "lucide-react";

const Home = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Parallax mouse effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const qrPositions = [
    { top: '10%', left: '8%', size: 'h-20 w-20', delay: '0s' },
    { top: '25%', right: '12%', size: 'h-16 w-16', delay: '2s' },
    { bottom: '30%', left: '15%', size: 'h-24 w-24', delay: '4s' },
    { bottom: '15%', right: '8%', size: 'h-20 w-20', delay: '1s' },
    { top: '60%', left: '5%', size: 'h-14 w-14', delay: '3s' },
    { top: '45%', right: '5%', size: 'h-12 w-12', delay: '5s' },
  ];

  return (
    <div className="min-h-screen bg-gradient-background relative overflow-hidden">

      {/* Floating QR Elements with Parallax */}
      <div className="absolute inset-0 pointer-events-none">
        {qrPositions.map((pos, index) => (
          <div
            key={index}
            className="absolute floating-qr parallax-qr"
            style={{
              ...pos,
              animationDelay: pos.delay,
              transform: `translate(${(mousePosition.x - 50) * 0.02}px, ${(mousePosition.y - 50) * 0.02}px)`,
            }}
          >
            <QrCode className={`${pos.size} text-primary/10 dark:text-primary/20`} />
          </div>
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative hero-glow scroll-section min-h-[60vh] flex items-center">
        <div className="max-w-4xl mx-auto px-6 pt-6 pb-12 text-center relative z-10">
          {/* Logo and Title */}
          <ScrollFadeIn>
            <div className="mb-8">
              <div className="flex items-center justify-center mb-6">
                <div className="p-3 bg-gradient-primary rounded-2xl shadow-xl">
                  <QrCode className="h-12 w-12 text-white" />
                </div>
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 gradient-text">
                TONNEX SCAN
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium">
                Professional QR and barcode scanning with intelligent parsing and flexible export
              </p>
            </div>
          </ScrollFadeIn>

          {/* Live Scan Demo */}
          <ScrollFadeIn delay={200}>
            <div className="mb-8 flex justify-center">
              <div className="relative scan-demo bg-card/80 backdrop-blur-sm rounded-xl p-6 border border-primary/20 shadow-xl">
                <QrCode className="h-16 w-16 text-primary mx-auto" />
                <div className="scan-beam"></div>
                <p className="text-sm text-muted-foreground mt-3 font-medium">Live scanning preview</p>
              </div>
            </div>
          </ScrollFadeIn>

          {/* Primary CTA */}
          <ScrollFadeIn delay={400}>
            <div className="mb-4">
              <Button 
                asChild 
                variant="hero" 
                size="xl" 
                className="mb-3 glow-button pulse-glow button-3d text-xl px-12 py-6 h-auto font-bold shadow-2xl bg-gradient-primary hover:bg-gradient-primary"
              >
                <Link to="/scanner">
                  <Scan className="mr-3 h-8 w-8" />
                  Start Scanning
                  <Sparkles className="ml-3 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </ScrollFadeIn>

          {/* Secondary Actions */}
          <ScrollFadeIn delay={600}>
            <div className="flex justify-center mb-8">
              <Button 
                asChild 
                variant="outline" 
                size="lg" 
                className="border-2 border-primary/30 hover:border-primary/60 hover:bg-primary/10 button-3d backdrop-blur-sm"
              >
                <Link to="/saved">
                  <Database className="mr-3 h-5 w-5" />
                  View Saved Scans
                </Link>
              </Button>
            </div>
          </ScrollFadeIn>
        </div>
      </section>


      {/* Features Section - Collapsible */}
      <section className="scroll-section max-w-4xl mx-auto px-6 pt-1 pb-12">
        <ScrollFadeIn>
          <Accordion type="single" collapsible defaultValue="features" className="w-full">
            <AccordionItem value="features" className="border-primary/20">
              <AccordionTrigger className="text-2xl md:text-3xl font-black gradient-text hover:no-underline">
                Enterprise-Grade Scanning Features
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-lg text-muted-foreground mb-8 text-center">
                  Built for professionals who demand precision, speed, and reliability
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="p-6 text-center card-lift border-0 shadow-xl bg-card/60 backdrop-blur-sm">
                    <div className="bg-gradient-primary rounded-2xl p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-xl">
                      <Zap className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-3 text-foreground">Lightning Fast</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Instant barcode recognition with batch scanning support
                    </p>
                  </Card>

                  <Card className="p-6 text-center card-lift border-0 shadow-xl bg-card/60 backdrop-blur-sm">
                    <div className="bg-gradient-primary rounded-2xl p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-xl">
                      <Target className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-3 text-foreground">Precision Parsing</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Automatically split serial numbers and IUC NUMBERS
                    </p>
                  </Card>

                  <Card className="p-6 text-center card-lift border-0 shadow-xl bg-card/60 backdrop-blur-sm">
                    <div className="bg-gradient-primary rounded-2xl p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-xl">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-3 text-foreground">Export Ready</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Export to Excel, CSV, or TXT with sharing options
                    </p>
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ScrollFadeIn>
      </section>

      {/* Export Formats Section - Compact */}
      <section className="scroll-section max-w-4xl mx-auto px-6 pt-3 pb-12">
        <ScrollFadeIn>
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-black gradient-text mb-3">
              Export Formats
            </h2>
            <p className="text-base text-muted-foreground">
              Choose your preferred export format
            </p>
          </div>
        </ScrollFadeIn>

        <ScrollFadeIn delay={200}>
          <div className="overflow-hidden w-full">
            <div className="export-scroll flex gap-4 whitespace-nowrap">
              <div className="pill-button bg-gradient-primary text-white px-8 py-4 rounded-full shadow-xl cursor-pointer button-3d min-w-fit">
                <div className="flex items-center space-x-3">
                  <FileSpreadsheet className="h-6 w-6" />
                  <span className="font-bold text-lg">Excel</span>
                </div>
              </div>
              
              <div className="pill-button bg-card/80 backdrop-blur-sm border-2 border-primary/30 text-foreground px-8 py-4 rounded-full shadow-xl cursor-pointer button-3d hover:border-primary/60 min-w-fit">
                <div className="flex items-center space-x-3">
                  <FileText className="h-6 w-6 text-primary" />
                  <span className="font-bold text-lg">CSV</span>
                </div>
              </div>
              
              <div className="pill-button bg-card/80 backdrop-blur-sm border-2 border-primary/30 text-foreground px-8 py-4 rounded-full shadow-xl cursor-pointer button-3d hover:border-primary/60 min-w-fit">
                <div className="flex items-center space-x-3">
                  <Download className="h-6 w-6 text-primary" />
                  <span className="font-bold text-lg">TXT</span>
                </div>
              </div>
              
              {/* Duplicate the elements for seamless loop */}
              <div className="pill-button bg-gradient-primary text-white px-8 py-4 rounded-full shadow-xl cursor-pointer button-3d min-w-fit">
                <div className="flex items-center space-x-3">
                  <FileSpreadsheet className="h-6 w-6" />
                  <span className="font-bold text-lg">Excel</span>
                </div>
              </div>
              
              <div className="pill-button bg-card/80 backdrop-blur-sm border-2 border-primary/30 text-foreground px-8 py-4 rounded-full shadow-xl cursor-pointer button-3d hover:border-primary/60 min-w-fit">
                <div className="flex items-center space-x-3">
                  <FileText className="h-6 w-6 text-primary" />
                  <span className="font-bold text-lg">CSV</span>
                </div>
              </div>
              
              <div className="pill-button bg-card/80 backdrop-blur-sm border-2 border-primary/30 text-foreground px-8 py-4 rounded-full shadow-xl cursor-pointer button-3d hover:border-primary/60 min-w-fit">
                <div className="flex items-center space-x-3">
                  <Download className="h-6 w-6 text-primary" />
                  <span className="font-bold text-lg">TXT</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollFadeIn>
      </section>

    </div>
  );
};

export default Home;