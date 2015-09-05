<?php include("source/head.php"); ?>

<body rel="index">

    <div class="center">
        <div id="container"></div>

        <input id="changeBtn" type="checkbox" onclick="changeBtn(this)" checked></input>
        <label class="switch" for="changeBtn"><span>PIE</span><span>BAR</span></label>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.6/d3.min.js" charset="utf-8"></script>
    <script type="text/javascript" src="js/chart.js"></script>

    <script type="text/javascript">
        // inject to target DOM
        var chart = new SproutChart(document.getElementById('container'), [
            {name: 'apple', value: 10},
            {name: 'orange', value: 13},
            {name: 'watermelon', value: 3},
            {name: 'banana', value: 12},
            {name: 'cherry', value: 8},
            {name: 'others', value: 9}
        ]);

        var options = {
            r: 120,
            rHover: 130,
            innerRadius: 90,
            spaceHover: 0,
            spaceActive: 10
        };

        // create pie chart
        chart.pieChart(options);

        function changeBtn(checkbox) {
            if (checkbox.checked) {
                chart.transformTo('pie', options);
            }
            else {
                chart.transformTo('bar', options);
            }
        }

    </script>
</body>

</html>
