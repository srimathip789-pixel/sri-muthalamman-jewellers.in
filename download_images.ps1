$imgDir = ".\assets\img"
New-Item -ItemType Directory -Path $imgDir -Force | Out-Null

$images = @(
    @{ file="gold-necklace-1.jpg";    id="photo-1599643477877-537ef5278533" },
    @{ file="gold-necklace-2.jpg";    id="photo-1515562141207-7a18b5ce7142" },
    @{ file="gold-necklace-3.jpg";    id="photo-1573408301185-9146fe634ad0" },
    @{ file="gold-necklace-4.jpg";    id="photo-1561828995-aa79a2db86dd"    },
    @{ file="gold-necklace-5.jpg";    id="photo-1584917865442-de89df76afd3" },
    @{ file="gold-earring-1.jpg";     id="photo-1535632066927-ab7c9ab60908" },
    @{ file="gold-earring-2.jpg";     id="photo-1611085583191-a3b181a88401" },
    @{ file="gold-earring-3.jpg";     id="photo-1617038220319-276d3cfab638" },
    @{ file="gold-bangle-1.jpg";      id="photo-1630019852942-f89202989a59" },
    @{ file="gold-bangle-2.jpg";      id="photo-1609946860441-a51ffcf22208" },
    @{ file="gold-ring-1.jpg";        id="photo-1605100804763-247f67b3557e" },
    @{ file="gold-ring-2.jpg";        id="photo-1603561591411-07134e71a2a9" },
    @{ file="gold-chain-1.jpg";       id="photo-1574671614491-c22fef3c0f0c" },
    @{ file="gold-chain-2.jpg";       id="photo-1506630448388-4e683c67ddb0" },
    @{ file="gold-choker-1.jpg";      id="photo-1559563458-527698bf5295"    },
    @{ file="gold-choker-2.jpg";      id="photo-1595503240812-7286dafaddc1" },
    @{ file="gold-haram-1.jpg";       id="photo-1616671276441-2f2c277b8bf6" },
    @{ file="gold-bridal-set-1.jpg";  id="photo-1560343090-f0409e92791a"   },
    @{ file="diamond-ring-1.jpg";     id="photo-1601121141461-9d6647bca1ed" },
    @{ file="silver-jewellery-1.jpg"; id="photo-1542596768-5d1d21f1cf98"   }
)

$headers = @{ "User-Agent" = "Mozilla/5.0" }
$success = 0
$fail = 0

foreach ($item in $images) {
    $outPath = Join-Path $imgDir $item.file
    $url = "https://images.unsplash.com/" + $item.id + "?w=800&q=85&fit=crop"
    try {
        Invoke-WebRequest -Uri $url -OutFile $outPath -Headers $headers -TimeoutSec 30 -ErrorAction Stop
        $kb = [math]::Round((Get-Item $outPath).Length / 1KB, 0)
        if ($kb -lt 5) {
            Remove-Item $outPath -Force
            Write-Host "SKIP (bad): $($item.file)" -ForegroundColor Yellow
            $fail++
        } else {
            Write-Host "OK ($kb KB): $($item.file)" -ForegroundColor Green
            $success++
        }
    } catch {
        Write-Host "FAIL: $($item.file)" -ForegroundColor Red
        $fail++
    }
}

Write-Host "Done: $success ok, $fail failed"
