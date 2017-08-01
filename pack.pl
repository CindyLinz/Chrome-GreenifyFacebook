#!/usr/bin/perl

use strict;
use warnings;

use Archive::Zip;

my $zip = Archive::Zip->new;
$zip->addFile($_, $_, 9) for(qw(content.js popup.html popup.js icon.png));

if( my @matched = grep /^firefox(-private)?$/, @ARGV ) {
    my $suffix = $matched[0] =~ /-private/? $&: '';
    my $manifest = do {
        open my($f), 'manifest.json';
        local $/;
        <$f>;
    };
    $manifest =~ s(\n(?=\})){
    , "applications":
      { "gecko":
        { "id": "\@GreenifyFacebook$suffix"
        }
      }
    };
    $zip->addString($manifest, 'manifest.json', 9);

    $zip->writeToFileNamed("GreenifyFacebook$suffix.xpi");
    print "Create Firefox pack GreenifyFacebook$suffix.xpi done.\n";
} else {
    $zip->addFile('manifest.json', 'manifest.json', 9);

    $zip->writeToFileNamed('GreenifyFacebook.zip');
    print "Create Chrome pack GreenifyFacebook.zip done.\n";
}

